import admin from 'firebase-admin';

export const getFcm = () => {
    if (!admin.apps.length) {
        const projectId = process.env.FIREBASE_PROJECT_ID || "vdf-ambulance";
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@vdf-ambulance.iam.gserviceaccount.com";
        const privateKey = process.env.FIREBASE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCkeSqpe3juo2xF\nN3qbjLQyaxn1k+OG9C20qYjsMfNeZOjM40nOVbi6W8mav3/rjzXMLNA1/H8YamJt\nVmdTh2ehv+QbkDV/inBn4BIHlLMb6JnTATzPCPZ48FzNvRIaJMtY/t+LfEvlX1WJ\nSXXlXjpcA0djQFjbi3Hdyq2x/s75xO0nvb9A2G5CKQh7Bqo16Lh0x/cMAdkyKbTu\nr1UfuoPUCdTyXKOXbMYINLX3q4s8GmB7f0MueteFyXkiapH18bPZNQqNWGim0Mh6\nZ6oa7YZ5vF5cIoHOZiVQ5z0a+LKe4ov2kF7m2NgHhy8RbhSAt1A3oXlM4xSlcYna\ncF4ACHeXAgMBAAECgf9Ksnits6pJyHdjxQHICdreHCyc9XyCeMnAurX9XG34CocF\nuc3tgYmXXfZUDXHHI4exu5d/D3Ig+eu53rcw0gn6n04LFISvAahPpw3ehapKNb/r\nJfoRps04qHoGB5RTOkCXxDqPYzl7WUhMiRB5xg2IAMIE2iOBCbGcGnCmZkaJBnDU\nj7ouZm4wrL9VkKZOXvl8Gxhu2RM02Lv1wHa+YEQDTbfBg5uqeqh+GhClW8nI6iNg\nFALl49K3SqJyCX+IgvcmsR1qThh0/bKgGHtG3iBPTWx2+2JILOD6TiN1CxJ4jvnN\np18C2do4Jn4TjtO/rZyFeeaLbP0G69MAj4n4DIECgYEAzUA3dyyIk6c4YW919Cys\n2VR0/Uosxq47SNlkZigi1Z3AtJLU8YuiZqpzljGWaXA9D9dLnrgdCQT5nzmSqJZk\nI7ZJ7cgbRpa1E5pidF/zUdyrOHZ0mJ+E2u6PWdD4bme9wRNr7waLEmtq72pq8rvQ\nOlxgw2RBufZ0XkCzNkwiWW0CgYEAzSPZmrNxvIjyZ5zJHRJvqEBLPUSZYorbLT40\RolptwsyhtkASd6uWyvvKZOumR0bIsrFbu/U4SHhbZI6FzyYgHBL/pb00NNLOBGA\nt7MECKBhS2aMMGHCQflHC3H3wu+8ncKjBnxKsjnBbwGd6cEl2h1DAsfD2a/Gc7Ij\nmL0G1pMCgYAJO45DKhmqqqb6mwzvQuMzk3z/t8pz1XqNOFovzjZi7YmxlblGdEWF\n4Lz6UJi3fXkBsWmRZi7ILRUdeHWEZ99xS83fiFTRxA25KAStv3Muh4KcM5fjFang\nP0Lrg17peHksqjb8tYqj9XkF8/+Dk7c2KNmhcG0UdGWfp8Fn+9y/sQKBgQCfFUkg\nHj56jd0mGsEfyXdLjCiM59DnSXV1HYMenFud9pIFXu1JW+XskCKVJJDG7npnvcXk\nJRr6R/LwrPBdqsE9AVj9owVRmDoBzhj63Fmpcu5gsbLPplAmJ3E/3+7afl3QHeud\nEPBATGfEdQWIDCAViJG56z7nZtfISwIt5ZES/wKBgQCFFQJDHwOzHU2FiofZebs9\nM3nva+m1Kz9PybE0qfRWU3TWCim8mbbBnMpE89JMnZiiPEN9FCHRgf6kaXr1iSGp\nnY9aoGQAmn39BewnwIZbyp2k+awvblcQxx0KSL949fa4ifPKtgfWHHIRH5y3iWYp\n/TBZfkeNcAj+n5hdaQpL/g==\n-----END PRIVATE KEY-----\n";

        if (projectId && clientEmail && privateKey) {
            try {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey: privateKey.replace(/\\n/g, '\n'),
                    }),
                });
            } catch (error) {
                console.error('Firebase admin initialization error', error);
                return null;
            }
        } else {
            return null;
        }
    }
    return admin.messaging();
};
