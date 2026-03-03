INSERT INTO "User" (id, email, password, role, "firstName", "lastName", name, "updatedAt")
VALUES (
    'cuid-superadmin-rh-1',
    'ambulancemark@gmail.com',
    '$2b$10$f02pmjCeisKB1OZJmhOYuueeugFgwy3o0XmXO.CViCplsFzlX7kA6',
    'RH',
    'Hamid',
    'CHEIKH',
    'Hamid CHEIKH',
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
    password = EXCLUDED.password, 
    role = EXCLUDED.role,
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    name = EXCLUDED.name;
