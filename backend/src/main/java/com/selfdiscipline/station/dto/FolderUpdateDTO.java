package com.selfdiscipline.station.dto;

import javax.validation.constraints.NotBlank;

/**
 * 修改文件夹请求体
 */
public class FolderUpdateDTO {

    @NotBlank(message = "文件夹名称不能为空")
    private String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
