package com.selfdiscipline.station.dto;

import javax.validation.constraints.NotBlank;

/**
 * 新增文件夹请求体
 */
public class FolderCreateDTO {

    @NotBlank(message = "文件夹名称不能为空")
    private String name;

    private Long parentId;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }
}
