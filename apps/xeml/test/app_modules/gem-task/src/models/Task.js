
module.exports = (Base) => class extends Base {
    static async getCompletedTasks_(userId, connOpts) {
        const $query = {
            assignedTo: userId,
            status: 'done'
        };

        const $projection = [
            'id',
            'type',
            'isApproved',
            'declinedReason',
            'name',
            'desc',
            'metadata',
            'statusDoneTimestamp'
        ];

        return this.findAll_({ $query, $projection }, connOpts);
    }

    static async saveSelfCompletedTasks_(userId, taskInfo, connOpts) {
        const input = {
            ...taskInfo,
            owner: userId,
            assignedTo: userId,
            status: 'done'
        }

        return this.create_(input, null, connOpts);
    }
};
