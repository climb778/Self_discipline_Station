package com.selfdiscipline.station.util;

public class UserContext {

    private static final ThreadLocal<Long> USER_ID = new ThreadLocal<>();

    public static void setUserId(Long userId) {
        USER_ID.set(userId);
    }

    public static Long getUserId() {
        return USER_ID.get();
    }

    /**
     * 获取当前用户 ID，如果为空则抛出异常
     */
    public static Long requireUserId() {
        Long userId = USER_ID.get();
        if (userId == null) {
            throw new IllegalStateException("未登录，无法获取当前用户 ID");
        }
        return userId;
    }

    public static void clear() {
        USER_ID.remove();
    }
}
