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

    @Value("${file.upload-path:uploads/notes/}")
    private String uploadPath;

    @Value("${file.access-prefix:/uploads/notes/}")
    private String accessPrefix;

    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

    private static final Set<String> ALLOWED_EXTS = new HashSet<>(Arrays.asList(
            "jpg", "jpeg", "png", "gif", "webp",
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "zip", "rar"
    ));

    private static final Set<String> DANGEROUS_EXTS = new HashSet<>(Arrays.asList(
            "exe", "bat", "cmd", "sh", "msi", "jar", "com", "scr", "pif",
            "vbs", "js", "ps1", "php", "py", "rb", "dll", "so", "app"
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

        // 1. 空文件检查
        if (file == null || file.isEmpty()) {
            return Result.fail(400, "上传文件不能为空");
        }

        // 2. 大小检查
        long size = file.getSize();
        if (size > MAX_FILE_SIZE) {
            return Result.fail(400, "文件大小不能超过 20MB");
        }

        // 3. 文件名处理
        String originalName = (originalNameParam != null && !originalNameParam.trim().isEmpty())
                ? originalNameParam.trim()
                : file.getOriginalFilename();
        if (originalName == null || originalName.isEmpty()) {
            return Result.fail(400, "文件名无效");
        }

        // 4. 路径穿越防护：只取文件名部分，去掉路径分隔符
        originalName = sanitizeFileName(originalName);
        if (originalName.isEmpty()) {
            return Result.fail(400, "文件名无效");
        }

        // 5. 提取扩展名
        String ext = "";
        int dotIdx = originalName.lastIndexOf('.');
        if (dotIdx > 0) {
            ext = originalName.substring(dotIdx + 1).toLowerCase();
        }
        if (ext.isEmpty()) {
            return Result.fail(400, "文件必须有扩展名");
        }

        // 6. 危险扩展名检查
        if (DANGEROUS_EXTS.contains(ext)) {
            return Result.fail(400, "不允许上传此类型的文件");
        }

        // 7. 白名单扩展名检查
        if (!ALLOWED_EXTS.contains(ext)) {
            return Result.fail(400, "不支持的文件类型: ." + ext);
        }

        // 8. 二次校验：检查 multipart 原始文件名的扩展名
        String rawName = file.getOriginalFilename();
        if (rawName != null && !rawName.isEmpty()) {
            String rawSanitized = sanitizeFileName(rawName);
            int rawDot = rawSanitized.lastIndexOf('.');
            if (rawDot > 0) {
                String rawExt = rawSanitized.substring(rawDot + 1).toLowerCase();
                if (!rawExt.equals(ext)) {
                    return Result.fail(400, "文件扩展名不一致，上传被拒绝");
                }
            }
        }

        // 9. 生成唯一文件名
        String uniqueName = System.currentTimeMillis() + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8) + "." + ext;

        // 10. 解析上传目录
        File dir = new File(uploadPath);
        if (!dir.isAbsolute()) {
            dir = new File(System.getProperty("user.dir"), uploadPath);
        }
        if (!dir.exists()) {
            dir.mkdirs();
        }

        // 11. 写入文件
        File dest = new File(dir, uniqueName);
        try {
            Files.copy(file.getInputStream(), dest.toPath(), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            return Result.fail(500, "文件保存失败");
        }

        String fileType = EXT_MIME_MAP.getOrDefault(ext, "application/octet-stream");

        // 12. 构建返回 URL
        String baseUrl = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("fileName", originalName);
        data.put("fileUrl", baseUrl + accessPrefix + uniqueName);
        data.put("fileType", fileType);
        data.put("fileSize", size);

        return Result.ok("上传成功", data);
    }

    /**
     * 文件名安全处理：去除路径分隔符和危险字符
     */
    private String sanitizeFileName(String name) {
        if (name == null) return "";
        // 取最后一个路径分隔符之后的部分（防路径穿越）
        int sep = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
        if (sep >= 0) {
            name = name.substring(sep + 1);
        }
        // 去除控制字符和特殊字符
        name = name.replaceAll("[\\x00-\\x1f\\x7f]", "");
        // 限制长度
        if (name.length() > 200) {
            name = name.substring(0, 200);
        }
        return name.trim();
    }
}
