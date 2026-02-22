-- Add isAdmin column to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "isAdmin" boolean NOT NULL DEFAULT false;

-- Add leader value to role enum
ALTER TYPE "role" ADD VALUE IF NOT EXISTS 'leader';

-- Add minimumRole column to list table
ALTER TABLE "list" ADD COLUMN IF NOT EXISTS "minimumRole" "role" NOT NULL DEFAULT 'member';

-- Add card:move permission to existing admin roles
INSERT INTO workspace_role_permissions ("workspaceRoleId", "permission")
SELECT wr.id, 'card:move'
FROM workspace_roles wr
WHERE wr."isSystem" = true AND wr.name = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM workspace_role_permissions wrp
  WHERE wrp."workspaceRoleId" = wr.id AND wrp."permission" = 'card:move'
);

-- Create leader system role for each existing workspace
INSERT INTO workspace_roles ("publicId", "workspaceId", name, description, "hierarchyLevel", "isSystem", "createdAt")
SELECT substr(md5(random()::text), 1, 12), w.id, 'leader', 'Full access within this workspace', 75, true, NOW()
FROM workspace w
WHERE NOT EXISTS (SELECT 1 FROM workspace_roles wr WHERE wr."workspaceId" = w.id AND wr.name = 'leader');

-- Seed leader role permissions (same as admin - all permissions)
INSERT INTO workspace_role_permissions ("workspaceRoleId", "permission")
SELECT wr.id, p.permission
FROM workspace_roles wr
CROSS JOIN (
  VALUES
    ('workspace:view'), ('workspace:edit'), ('workspace:delete'), ('workspace:manage'),
    ('board:view'), ('board:create'), ('board:edit'), ('board:delete'),
    ('list:view'), ('list:create'), ('list:edit'), ('list:delete'),
    ('card:view'), ('card:create'), ('card:edit'), ('card:delete'), ('card:move'),
    ('comment:view'), ('comment:create'), ('comment:edit'), ('comment:delete'),
    ('member:view'), ('member:invite'), ('member:edit'), ('member:remove')
) AS p(permission)
WHERE wr."isSystem" = true AND wr.name = 'leader'
AND NOT EXISTS (
  SELECT 1 FROM workspace_role_permissions wrp
  WHERE wrp."workspaceRoleId" = wr.id AND wrp."permission" = p.permission
);

-- Add card:move permission to existing member roles
INSERT INTO workspace_role_permissions ("workspaceRoleId", "permission")
SELECT wr.id, 'card:move'
FROM workspace_roles wr
WHERE wr."isSystem" = true AND wr.name = 'member'
AND NOT EXISTS (
  SELECT 1 FROM workspace_role_permissions wrp
  WHERE wrp."workspaceRoleId" = wr.id AND wrp."permission" = 'card:move'
);

-- Remove permissions from member role that members should no longer have
DELETE FROM workspace_role_permissions
WHERE "workspaceRoleId" IN (SELECT id FROM workspace_roles WHERE "isSystem" = true AND name = 'member')
AND "permission" IN (
  'board:create', 'board:edit', 'board:delete',
  'list:create', 'list:edit', 'list:delete',
  'card:create', 'card:edit', 'card:delete',
  'comment:edit', 'comment:delete',
  'member:invite', 'member:edit', 'member:remove',
  'workspace:edit', 'workspace:delete', 'workspace:manage'
);

-- Migrate existing workspace admins to leaders
UPDATE workspace_members SET role = 'leader' WHERE role = 'admin';

-- Update roleId for migrated leaders to point to the leader system role
UPDATE workspace_members wm
SET "roleId" = wr.id
FROM workspace_roles wr
WHERE wr."workspaceId" = wm."workspaceId"
AND wr.name = 'leader'
AND wr."isSystem" = true
AND wm.role = 'leader';

-- Make first user a global admin
UPDATE "user" SET "isAdmin" = true WHERE id = (SELECT id FROM "user" ORDER BY "createdAt" ASC LIMIT 1);
