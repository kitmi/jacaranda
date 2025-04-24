# 客户端API调用代码生成

## 配置文件

以Service Name为文件名，如`wmpAdmin.json`，则通过`Runtime.$wmpAdmin`访问`HttpClient`。

```json
{
    "groupRules": {
        "protected": {
            "auth": "jwt" // protected组的API用 `Runtime.$wmpAdmin.jwt()` 访问`HttpClient`
        }
    },
    "endpointRules": { // 特殊endpoint的命名
        "put:/resource": "uploadResource_"
    }
    
}
```

## HttpClient方法

- async get_(resource, query, options)
- async post_(resource, data, query, options)
- async put_(resource, data, query, options)
- async patch_(resource, data, query, options)
- async delete_(resource, query, options)

## 命名规范

- 获取列表，对应GET方法
  - "get" + ResourceName + "List_", e.g., getProjectList_
- 获取详情，对应GET方法
  - "get" + ResourceName + "_", e.g., getProject_
- 新建，对应POST方法
  - "create" + ResourceName + "_", e.g., createProject_
- 修改，对应PATCH方法
  - "update" + ResourceName + "_", e.g., updateProject_
- 删除，对应DELETE方法
  - "delete" + ResourceName + "_", e.g., deleteProject_
- 其他特殊情況，参照配置文件

