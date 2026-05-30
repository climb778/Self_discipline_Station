package com.selfdiscipline.station.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@TableName("note_version")
public class NoteVersion implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long noteId;

    private Long userId;

    private String title;

    private String content;

    private String tags;

    private Long folderId;

    private Integer isPinned;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getNoteId() { return noteId; }
    public void setNoteId(Long noteId) { this.noteId = noteId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public Long getFolderId() { return folderId; }
    public void setFolderId(Long folderId) { this.folderId = folderId; }

    public Integer getIsPinned() { return isPinned; }
    public void setIsPinned(Integer isPinned) { this.isPinned = isPinned; }

    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }
}
