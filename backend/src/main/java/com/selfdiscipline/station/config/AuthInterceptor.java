package com.selfdiscipline.station.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.selfdiscipline.station.common.Result;
import com.selfdiscipline.station.util.JwtUtil;
import com.selfdiscipline.station.util.UserContext;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Autowired
    private JwtUtil jwtUtil;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // OPTIONS 请求放行，避免跨域预检失败
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                Claims claims = jwtUtil.parseToken(token);
                Long userId = claims.get("userId", Long.class);
                UserContext.setUserId(userId);
                return true;
            } catch (Exception e) {
                // token 无效或过期
            }
        }

        response.setStatus(401);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(Result.fail(401, "未登录或登录已过期")));
        return false;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserContext.clear();
    }
}
