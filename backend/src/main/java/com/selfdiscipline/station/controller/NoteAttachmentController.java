package com.selfdiscipline.station.controller;

import com.selfdiscipline.station.common.Result;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.*;

@RestController
@RequestMapping("/api/note-attachments")
public class NoteAttachmentController {

    // TODO: 部署时改成服务器实际绝对路径
    @Value("${file.upload-path:uploads/notes/}")
    private String uploadPath;

    @Value("${file.access-prefix:/uploads/notes/}")
    private String accessPrefix;

    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

    private static final Set<String> ALLOWED_EXTS = new HashSet<>(Arrays.asList(
            "jpg", "jpeg", "png", "gif", "webp",
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "zip", "rar"
    ));

    private static final Map<String, String> EXT_MIME_MAP = new HashMap<>();
    static {
        EXT_MIME_MAP.put("jpg", "image/jpeg");
        EXT_MIME_MAP.put("jpeg", "image/jpeg");
        EXT_MIME_MAP.put("png", "image/png");
        EXT_MIME_MAP.put("gif", "image/gif");
        EXT_MIME_MAP.put("webp", "image/webp");
        EXT_MIME_MAP.put("pdf", "application/pdf");
        EXT_MIME_MAP.put("doc", "application/msword");
        EXT_MIME_MAP.put("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        EXT_MIME_MAP.put("xls", "application/vnd.ms-excel");
        EXT_MIME_MAP.put("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        EXT_MIME_MAP.put("ppt", "application/vnd.ms-powerpoint");
        EXT_MIME_MAP.put("pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
        EXT_MIME_MAP.put("txt", "text/plain");
        EXT_MIME_MAP.put("zip", "application/zip");
        EXT_MIME_MAP.put("rar", "application/x-rar-compressed");
    }

    @PostMapping("/upload")
    public Result<Map<String, Object>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "originalName", required = false) String originalNameParam,
            HttpServletRequest request) {
        if (file == null || file.isEmpty()) {
            return Result.fail("上传文件不能为空");
        }

        long size = file.getSize();
        if (size > MAX_FILE_SIZE) {
            return Result.fail("文件大小不能超过 20MB");
        }

        // 优先使用前端传入的原始文件名（blob URL 场景下 multipart 丢失文件名）
        String originalName = (originalNameParam != null && !originalNameParam.isEmpty())
                ? originalNameParam
                : file.getOriginalFilename();
        if (originalName == null || originalName.isEmpty()) {
            return Result.fail("文件名无效");
        }

        // 提取扩展名
        String ext = "";
        int dotIdx = originalName.lastIndexOf('.');
        if (dotIdx > 0) {
            ext = originalName.substring(dotIdx + 1).toLowerCase();
        }

        if (!ALLOWED_EXTS.contains(ext)) {
            return Result.fail("不支持的文件类型: ." + ext);
        }

        // 二次校验：检查 multipart 原始文件名的扩展名，防止绕过 originalNameParam
        String rawName = file.getOriginalFilename();
        if (rawName != null && !rawName.isEmpty()) {
            int rawDot = rawName.lastIndexOf('.');
            if (rawDot > 0) {
                String rawExt = rawName.substring(rawDot + 1).toLowerCase();
                if (!rawExt.equals(ext)) {
                    return Result.fail("文件扩展名不一致，上传被拒绝");
                }
            }
        }

        // 生成唯一文件名: 时间戳 + 随机串 + 原始后缀
        String uniqueName = System.currentTimeMillis() + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8) + "." + ext;

        // 解析为绝对路径，避免 transferTo 解析到 Tomcat 临时目录
        File dir = new File(uploadPath);
        if (!dir.isAbsolute()) {
            dir = new File(System.getProperty("user.dir"), uploadPath);
        }
        if (!dir.exists()) {
            dir.mkdirs();
        }

        File dest = new File(dir, uniqueName);
        try {
            // 使用 Files.copy 替代 transferTo，兼容性更好
            Files.copy(file.getInputStream(), dest.toPath(), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            return Result.fail("文件保存失败: " + e.getMessage());
        }

        String fileType = EXT_MIME_MAP.getOrDefault(ext, "application/octet-stream");

        // 构建完整 URL（包含协议、主机、端口）
        String baseUrl = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("fileName", originalName);
        data.put("fileUrl", baseUrl + accessPrefix + uniqueName);
        data.put("fileType", fileType);
        data.put("fileSize", size);

        return Result.ok("上传成功", data);
    }
}
