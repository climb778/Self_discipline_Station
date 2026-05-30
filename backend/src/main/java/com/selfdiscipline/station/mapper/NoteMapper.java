package com.selfdiscipline.station.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.selfdiscipline.station.entity.Note;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface NoteMapper extends BaseMapper<Note> {

    /**
     * 查询回收站笔记（绕过 @TableLogic 自动过滤 is_deleted=0）
     */
    @Select("SELECT * FROM note WHERE is_deleted = 1 AND user_id = #{userId} ORDER BY update_time DESC")
    List<Note> selectTrashNotes(@Param("userId") Long userId);

    /**
     * 恢复笔记：将 is_deleted 从 1 改为 0（绕过 @TableLogic）
     */
    @Update("UPDATE note SET is_deleted = 0, update_time = NOW() WHERE id = #{id} AND is_deleted = 1")
    int restoreById(@Param("id") Long id);

    /**
     * 彻底删除笔记（物理删除，绕过 @TableLogic）
     */
    @Delete("DELETE FROM note WHERE id = #{id} AND is_deleted = 1")
    int permanentDeleteById(@Param("id") Long id);

    /**
     * 查询所有笔记的标签（绕过 @TableLogic，排除空标签）
     */
    @Select("SELECT tags FROM note WHERE user_id = #{userId} AND is_deleted = 0 AND tags IS NOT NULL AND tags != ''")
    List<String> selectAllTags(@Param("userId") Long userId);

    /**
     * 查询所有有标签的笔记 id 和 tags（用于批量归一化）
     */
    @Select("SELECT id, tags FROM note WHERE user_id = #{userId} AND is_deleted = 0 AND tags IS NOT NULL AND tags != ''")
    List<Note> selectTaggedNotes(@Param("userId") Long userId);

    /**
     * 仅更新 tags 字段（绕过 @TableLogic 不影响，因为 is_deleted 已是 0）
     */
    @Update("UPDATE note SET tags = #{tags}, update_time = NOW() WHERE id = #{id}")
    int updateTagsById(@Param("id") Long id, @Param("tags") String tags);
}
