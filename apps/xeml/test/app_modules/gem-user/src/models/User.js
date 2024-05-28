const {
    ValidationError,
    InvalidArgument,
    BadRequest,
    Forbidden,
} = require('@genx/error');
const {
    Processors,
    Validators,
    Generators,
    Convertors,
    Utils: { Lang },
} = require('@genx/data');
const { _, isPlainObject, eachAsync_ } = require('@genx/july');

module.exports = (Base) =>
    class extends Base {
        static omitCredentials(user) {
            return _.omit(user, ['password', 'passwordSalt']);
        }

        static validatePassword(user, password) {
            if (!user) {
                throw new ValidationError('Invalid credential');
            }

            // validate password with hash
            const hashedPassword = this.$hashPassword(
                password,
                user.passwordSalt
            );
            if (hashedPassword !== user.password) {
                throw new ValidationError('Invalid credential');
            }
        }

        static async validateUserCredential_(username, password) {
            const query = { status: 'active' };
            let loginBy = 'username';

            if (Validators.isPhone(username)) {
                query.mobile = Processors.normalizePhone(username, '+886');
                loginBy = 'mobile';
            } else if (Validators.isEmail(username)) {
                query.email = username.toLowerCase();
                loginBy = 'email';
            } else {
                query.username = username;
            }

            const user = await this.findOne_({
                $query: query,
                $association: ['roles.role'],
            });

            if (loginBy === 'mobile') {
                if (!user.isMobileVerified) {
                    throw new ValidationError('Mobile not verified.');
                }
            } else if (loginBy === 'email') {
                if (!user.isEmailVerified) {
                    throw new ValidationError('Email not verified.');
                }
            }

            this.validatePassword(user, password);

            // omit credential properties
            return this.omitCredentials(user);
        }

        static async loginUser_(loggedInUser, requireRoles, forUsage) {
            const user = _.pick(loggedInUser, [
                'id',
                'username',
                'mobile',
                'email',
                'avatar',
                'name',
            ]);

            if (loggedInUser.person) {
                const Person = this.db.model('Person');
                const person = await Person.findOne_(loggedInUser.person);
                user[':person'] = person;
            }

            let roles = loggedInUser[':roles'];

            if (forUsage) {
                roles = roles.filter(
                    (role) =>
                        role[':role'].usage === forUsage &&
                        !role[':role'].isSpecific
                );
                if (roles.length === 0) {
                    throw new Forbidden('Permission denied.');
                }
            }

            user.roles = roles ? roles.map((r) => r.role) : [];

            if (requireRoles) {
                const matchRoles = _.intersection(user.roles, requireRoles);
                if (matchRoles.length === 0) {
                    throw new Forbidden('Permission denied.');
                }
            }

            const loggedInTime = this.db.app.now();

            await this.updateOne_(
                {
                    currentLoginTime: loggedInTime,
                    lastLoginTime: Lang.$col('currentLoginTime'),
                },
                loggedInUser.id
            );

            return user;
        }

        static async addUnverifiedUser_(userInput, connOpts) {
            let { username, mobile, email } = userInput;

            userInput.email = email.toLowerCase();

            const anyMatch = [
                {
                    email,
                },
            ];

            if (username) {
                anyMatch.push({ username });
            }

            if (mobile) {
                mobile = Processors.normalizePhone(mobile, '+886');
                userInput.mobile = mobile;
                anyMatch.push({ mobile });
            }

            return this.db.doTransaction_(
                async (connOpts) => {
                    const users = await this.findAll_(
                        {
                            $query: { status: 'active', $or: anyMatch },
                        },
                        connOpts
                    );

                    if (users.length > 0) {
                        const user = users[0];
                        let whereSame;
                        if (user.email === email) {
                            whereSame = 'email';
                        } else if (mobile && user.mobile === mobile) {
                            whereSame = 'mobile';
                        } else {
                            whereSame = 'username';
                        }

                        throw new ValidationError(
                            `User with the same "${whereSame}" already exists.`
                        );
                    }

                    const _userInput = {
                        ...userInput,
                        ':resourceGroup': {
                            entityName: this.meta.name,
                        },
                    };

                    _userInput.password = Generators.uuid();

                    return this.create_(
                        _userInput,
                        { $retrieveCreated: true },
                        connOpts
                    );
                },
                null,
                connOpts
            );
        }

        // todo: review
        static async doesUserExist_(username, excludeAgent) {
            const query = { dupId: 0 },
                extra = {};

            if (Validators.isPhone(username)) {
                query.mobile = Processors.normalizePhone(username, '+61');
            } else if (Validators.isEmail(username)) {
                query.email = username.toLowerCase();
            } else {
                throw new ValidationError('Invalid username.');
            }

            if (excludeAgent) {
                extra.$association = ['roles'];
            }

            const user = await this.findOne_({
                $query: query,
                ...extra,
            });

            if (excludeAgent) {
                return (
                    user &&
                    _.every(user[':roles'], (role) => role.role !== 'AGENT')
                );
            }

            return !!user;
        }

        // todo: review
        static async checkUserWithAnyOf_(mobile, email) {
            let query;

            if (!mobile) {
                if (!email) {
                    throw new BadRequest('Both mobile and email are empty.');
                }

                query = {
                    email,
                    dupId: 0,
                };
            } else if (!email) {
                query = {
                    mobile,
                    dupId: 0,
                };
            } else {
                query = {
                    $or: [{ mobile }, { email }],
                    dupId: 0,
                };
            }

            const users = await this.findAll_({
                $query: query,
                $association: ['roles'],
            });

            if (users.length > 1) {
                throw new BadRequest(
                    'The specified mobile and email link to two different users.'
                );
            }

            return users.length > 0 ? users[0] : undefined;
        }

        static async activate_(verifyInfo, password, connOpts) {
            const payload =
                verifyInfo.payload && JSON.parse(verifyInfo.payload);

            const userData = {
                status: 'active',
            };

            if (password) {
                userData.password = password;
            }

            if (verifyInfo.email) {
                userData.isEmailVerified = true;
            } else if (verifyInfo.mobile) {
                userData.isMobileVerified = true;
            }

            const user = await this.updateOne_(
                userData,
                {
                    $query: {
                        id: verifyInfo.user,
                    },
                    $retrieveUpdated: {
                        $association: ['roles'],
                    },
                },
                connOpts
            );

            console.log(user);

            if (payload.roles && payload.roles.length > 0) {
                await this.grantRoles_(user, payload.roles, payload, connOpts);
            }
        }

        static async grantRoles_(user, roles, payload, connOpts) {
            const userRoleTypes = await this.db.model('UserRoleType').findAll_(
                {
                    code: { $in: roles },
                    usage: { $exist: true },
                },
                connOpts
            );

            return this.db.doTransaction_(
                async (connOpts) => {
                    if (!isPlainObject(user) || !user[':roles']) {
                        user = await this.findOne_(
                            {
                                $query: {
                                    id: isPlainObject(user) ? user.id : user,
                                },
                                $association: ['roles'],
                            },
                            connOpts
                        );
                    }

                    const currentRoles = new Set([
                        user[':roles'].map((role) => role.role),
                    ]);

                    roles.forEach((role) => {
                        currentRoles.add(role);
                    });

                    await this.db.connector.insertMany_(
                        'userRole',
                        ['user', 'role'],
                        Array.from(roles).map((role) => [user.id, role]),
                        { ...connOpts, insertIgnore: true }
                    );

                    if (userRoleTypes.length > 0) {
                        await eachAsync_(userRoleTypes, (role) =>
                            this.grantSpecialRole_(
                                user,
                                role,
                                payload,
                                connOpts
                            )
                        );
                    }
                },
                null,
                connOpts
            );
        }
    };
