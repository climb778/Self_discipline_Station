package com.selfdiscipline.station.dto;

import javax.validation.constraints.NotBlank;

/**
 * 新增笔记请求体
 */
public class NoteCreateDTO {

    @NotBlank(message = "标题不能为空")
    private String title;

    private String content;

    private Long folderId;

    private String tags;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Long getFolderId() {
        return folderId;
    }

    public void setFolderId(Long folderId) {
        this.folderId = folderId;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }
}
