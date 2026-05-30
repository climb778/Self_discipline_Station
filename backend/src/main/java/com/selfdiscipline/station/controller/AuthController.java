package com.selfdiscipline.station.controller;

import com.selfdiscipline.station.common.Result;
import com.selfdiscipline.station.dto.ChangePasswordDTO;
import com.selfdiscipline.station.dto.LoginDTO;
import com.selfdiscipline.station.dto.RegisterDTO;
import com.selfdiscipline.station.entity.AppUser;
import com.selfdiscipline.station.service.AppUserService;
import com.selfdiscipline.station.util.JwtUtil;
import com.selfdiscipline.station.util.UserContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AppUserService appUserService;

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${app.register.enabled:true}")
    private boolean registerEnabled;

    @Value("${app.register.invite-code:}")
    private String inviteCode;

    @PostMapping("/register")
    public Result<Map<String, Object>> register(@Valid @RequestBody RegisterDTO dto) {
        if (!registerEnabled) {
            return Result.fail(403, "注册功能已关闭");
        }
        if (!inviteCode.equals(dto.getInviteCode())) {
            return Result.fail(400, "邀请码错误");
        }
        if (!dto.getPassword().equals(dto.getConfirmPassword())) {
            return Result.fail(400, "两次密码不一致");
        }
        if (appUserService.findByUsername(dto.getUsername()) != null) {
            return Result.fail(400, "用户名已存在");
        }

        AppUser user = appUserService.register(dto.getUsername(), dto.getPassword(), dto.getNickname());

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());

        Map<String, Object> userInfo = new LinkedHashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("nickname", user.getNickname());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("token", token);
        data.put("user", userInfo);

        return Result.ok("注册成功", data);
    }

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@Valid @RequestBody LoginDTO dto) {
        AppUser user = appUserService.findByUsername(dto.getUsername());
        if (user == null || !appUserService.checkPassword(user, dto.getPassword())) {
            return Result.fail(401, "用户名或密码错误");
        }
        if (user.getStatus() != null && user.getStatus() == 0) {
            return Result.fail(403, "账号已被禁用");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());

        Map<String, Object> userInfo = new LinkedHashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("nickname", user.getNickname());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("token", token);
        data.put("user", userInfo);

        return Result.ok("登录成功", data);
    }

    @GetMapping("/me")
    public Result<Map<String, Object>> me() {
        Long userId = UserContext.getUserId();
        AppUser user = appUserService.getById(userId);
        if (user == null) {
            return Result.fail(404, "用户不存在");
        }

        Map<String, Object> info = new LinkedHashMap<>();
        info.put("id", user.getId());
        info.put("username", user.getUsername());
        info.put("nickname", user.getNickname());
        return Result.ok(info);
    }

    @PostMapping("/change-password")
    public Result<Void> changePassword(@Valid @RequestBody ChangePasswordDTO dto) {
        Long userId = UserContext.getUserId();
        try {
            appUserService.changePassword(userId, dto.getOldPassword(), dto.getNewPassword());
            return Result.ok("密码修改成功", null);
        } catch (RuntimeException e) {
            return Result.fail(400, e.getMessage());
        }
    }
}
