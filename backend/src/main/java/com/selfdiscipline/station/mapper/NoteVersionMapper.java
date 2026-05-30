package com.selfdiscipline.station.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.selfdiscipline.station.entity.NoteVersion;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface NoteVersionMapper extends BaseMapper<NoteVersion> {

    /**
     * 删除指定笔记的所有版本（彻底删除笔记时级联清理）
     */
    @Delete("DELETE FROM note_version WHERE note_id = #{noteId}")
    int deleteByNoteId(@Param("noteId") Long noteId);

    /**
     * 只保留每个笔记最新的 maxCount 个版本，删除多余的旧版本
     * 子查询先找出需要保留的 id，再删除不在其中的记录
     */
    @Delete("DELETE FROM note_version WHERE note_id = #{noteId} AND id NOT IN " +
            "(SELECT keep_id FROM (SELECT id AS keep_id FROM note_version WHERE note_id = #{noteId} ORDER BY create_time DESC LIMIT #{maxCount}) tmp)")
    int trimOldVersions(@Param("noteId") Long noteId, @Param("maxCount") int maxCount);
}
