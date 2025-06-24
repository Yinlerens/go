// prisma/seed.ts
// 这是主种子文件，可以通过 npx prisma db seed 运行

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 功能权限数据
const abilities = [
  // 用户管理模块
  {
    name: "用户管理",
    code: "user_management",
    module: "系统管理",
    actions: ["create", "read", "update", "delete", "export", "import", "reset_password"],
    description: "管理系统用户的增删改查及密码重置",
    isActive: true,
    isSystem: true
  },
  {
    name: "用户查看",
    code: "user_view",
    module: "系统管理",
    actions: ["read"],
    description: "仅可查看用户列表和详情",
    isActive: true,
    isSystem: true
  },

  // 角色管理模块
  {
    name: "角色管理",
    code: "role_management",
    module: "系统管理",
    actions: ["create", "read", "update", "delete", "assign_permissions"],
    description: "管理系统角色及权限分配",
    isActive: true,
    isSystem: true
  },
  {
    name: "角色查看",
    code: "role_view",
    module: "系统管理",
    actions: ["read"],
    description: "仅可查看角色列表",
    isActive: true,
    isSystem: true
  },

  // 菜单管理模块
  {
    name: "菜单管理",
    code: "menu_management",
    module: "系统管理",
    actions: ["create", "read", "update", "delete", "sort"],
    description: "管理系统菜单的增删改查及排序",
    isActive: true,
    isSystem: true
  },
  {
    name: "菜单查看",
    code: "menu_view",
    module: "系统管理",
    actions: ["read"],
    description: "仅可查看菜单列表",
    isActive: true,
    isSystem: true
  },

  // 部门管理模块
  {
    name: "部门管理",
    code: "department_management",
    module: "系统管理",
    actions: ["create", "read", "update", "delete", "tree"],
    description: "管理组织架构部门",
    isActive: true,
    isSystem: true
  },
  {
    name: "部门查看",
    code: "department_view",
    module: "系统管理",
    actions: ["read", "tree"],
    description: "仅可查看部门结构",
    isActive: true,
    isSystem: true
  },

  // 审计日志模块
  {
    name: "审计日志查看",
    code: "audit_log_view",
    module: "系统监控",
    actions: ["read", "export"],
    description: "查看系统操作日志",
    isActive: true,
    isSystem: true
  },
  {
    name: "审计日志管理",
    code: "audit_log_management",
    module: "系统监控",
    actions: ["read", "delete", "export", "clean"],
    description: "管理系统操作日志，包括清理历史日志",
    isActive: true,
    isSystem: true
  },

  // 系统设置模块
  {
    name: "系统设置",
    code: "system_settings",
    module: "系统配置",
    actions: ["read", "update"],
    description: "配置系统参数",
    isActive: true,
    isSystem: true
  },
  {
    name: "缓存管理",
    code: "cache_management",
    module: "系统配置",
    actions: ["read", "clear", "refresh"],
    description: "管理系统缓存",
    isActive: true,
    isSystem: true
  },

  // 个人中心模块
  {
    name: "个人信息修改",
    code: "profile_update",
    module: "个人中心",
    actions: ["read", "update", "upload_avatar"],
    description: "修改个人信息和头像",
    isActive: true,
    isSystem: true
  },
  {
    name: "修改密码",
    code: "change_password",
    module: "个人中心",
    actions: ["update"],
    description: "修改自己的登录密码",
    isActive: true,
    isSystem: true
  }
];

async function main() {
  console.log("开始数据库初始化...");

  try {
    // 1. 创建功能权限
    console.log("\n1. 创建功能权限...");
    for (const ability of abilities) {
      await prisma.ability.upsert({
        where: { code: ability.code },
        update: {
          ...ability,
          actions: ability.actions as any,
          updatedAt: new Date()
        },
        create: {
          ...ability,
          actions: ability.actions as any,
          config: {}
        }
      });
      console.log(`   ✓ ${ability.name} (${ability.code})`);
    }

    // 2. 创建默认角色
    console.log("\n2. 创建默认角色...");
    const superAdminRole = await prisma.role.upsert({
      where: { code: "SUPER_ADMIN" },
      update: {},
      create: {
        name: "超级管理员",
        code: "SUPER_ADMIN",
        description: "系统超级管理员，拥有所有权限",
        type: "SYSTEM",
        level: 1,
        dataScope: "ALL",
        isActive: true,
        isSystem: true,
        isDefault: false
      }
    });
    console.log("   ✓ 超级管理员");

    const adminRole = await prisma.role.upsert({
      where: { code: "ADMIN" },
      update: {},
      create: {
        name: "管理员",
        code: "ADMIN",
        description: "系统管理员，拥有除系统设置外的所有权限",
        type: "SYSTEM",
        level: 10,
        dataScope: "ALL",
        isActive: true,
        isSystem: true,
        isDefault: false
      }
    });
    console.log("   ✓ 管理员");

    const userRole = await prisma.role.upsert({
      where: { code: "USER" },
      update: {},
      create: {
        name: "普通用户",
        code: "USER",
        description: "普通用户，拥有基础权限",
        type: "SYSTEM",
        level: 100,
        dataScope: "SELF",
        isActive: true,
        isSystem: true,
        isDefault: true
      }
    });
    console.log("   ✓ 普通用户");

    // 3. 创建基础菜单
    console.log("\n3. 创建基础菜单...");
    const dashboardMenu = await prisma.menu.upsert({
      where: { code: "dashboard" },
      update: {},
      create: {
        name: "仪表盘",
        code: "dashboard",
        type: "MENU",
        path: "/dashboard",
        component: "@/views/dashboard/index",
        title: "仪表盘",
        icon: "dashboard",
        level: 1,
        sort: 0,
        isVisible: true,
        isActive: true,
        isCache: false,
        isAffix: true
      }
    });
    console.log("   ✓ 仪表盘");

    const systemMenu = await prisma.menu.upsert({
      where: { code: "system" },
      update: {},
      create: {
        name: "系统管理",
        code: "system",
        type: "DIRECTORY",
        path: "/system",
        title: "系统管理",
        icon: "system",
        level: 1,
        sort: 10,
        isVisible: true,
        isActive: true,
        isCache: false,
        isAffix: false
      }
    });
    console.log("   ✓ 系统管理");

    // 系统管理子菜单
    const menus = [
      {
        parentId: systemMenu.id,
        name: "用户管理",
        code: "user",
        path: "/system/user",
        component: "@/views/system/user/index",
        title: "用户管理",
        icon: "user",
        sort: 0
      },
      {
        parentId: systemMenu.id,
        name: "角色管理",
        code: "role",
        path: "/system/role",
        component: "@/views/system/role/index",
        title: "角色管理",
        icon: "role",
        sort: 1
      },
      {
        parentId: systemMenu.id,
        name: "菜单管理",
        code: "menu",
        path: "/system/menu",
        component: "@/views/system/menu/index",
        title: "菜单管理",
        icon: "menu",
        sort: 2
      }
    ];

    for (const menu of menus) {
      await prisma.menu.upsert({
        where: { code: menu.code },
        update: {},
        create: {
          ...menu,
          type: "MENU",
          level: 2,
          isVisible: true,
          isActive: true,
          isCache: false,
          isAffix: false
        }
      });
      console.log(`   ✓ ${menu.name}`);
    }

    // 4. 分配权限
    console.log("\n4. 分配角色权限...");

    // 获取所有菜单和功能权限
    const allMenus = await prisma.menu.findMany({
      where: { isDeleted: false, isActive: true }
    });
    const allAbilities = await prisma.ability.findMany({
      where: { isActive: true }
    });

    // 超级管理员 - 所有权限
    await prisma.role.update({
      where: { id: superAdminRole.id },
      data: {
        menus: {
          set: allMenus.map(menu => ({ id: menu.id }))
        },
        abilities: {
          set: allAbilities.map(ability => ({ id: ability.id }))
        }
      }
    });
    console.log("   ✓ 超级管理员权限分配完成");

    // 管理员 - 排除系统配置
    const adminMenus = allMenus.filter(menu => !menu.code.includes("settings"));
    const adminAbilities = allAbilities.filter(ability => ability.module !== "系统配置");

    await prisma.role.update({
      where: { id: adminRole.id },
      data: {
        menus: {
          set: adminMenus.map(menu => ({ id: menu.id }))
        },
        abilities: {
          set: adminAbilities.map(ability => ({ id: ability.id }))
        }
      }
    });
    console.log("   ✓ 管理员权限分配完成");

    // 普通用户 - 基础权限
    const userMenus = allMenus.filter(menu => ["dashboard", "profile"].includes(menu.code));
    const userAbilities = allAbilities.filter(ability => ability.module === "个人中心");

    await prisma.role.update({
      where: { id: userRole.id },
      data: {
        menus: {
          set: userMenus.map(menu => ({ id: menu.id }))
        },
        abilities: {
          set: userAbilities.map(ability => ({ id: ability.id }))
        }
      }
    });
    console.log("   ✓ 普通用户权限分配完成");

    // 5. 创建测试管理员账号
    console.log("\n5. 创建测试账号...");
    const hashedPassword = await bcrypt.hash("Admin@123", 12);

    const adminUser = await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        email: "admin@example.com",
        password: hashedPassword,
        nickname: "系统管理员",
        status: "ACTIVE",
        isActive: true,
        userRoles: {
          create: {
            roleId: superAdminRole.id
          }
        }
      }
    });
    console.log("   ✓ 测试管理员账号创建完成");
    console.log("     邮箱: admin@example.com");
    console.log("     密码: Admin@123");

    console.log("\n✅ 数据库初始化完成！");
  } catch (error) {
    console.error("❌ 初始化失败:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
