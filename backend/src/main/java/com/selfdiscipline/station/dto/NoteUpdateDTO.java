package com.selfdiscipline.station.dto;

/**
 * 修改笔记请求体
 */
public class NoteUpdateDTO {

    private String title;

    private String content;

    private Long folderId;

    private String tags;

    private Integer isPinned;

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

    public Integer getIsPinned() {
        return isPinned;
    }

    public void setIsPinned(Integer isPinned) {
        this.isPinned = isPinned;
    }
}
