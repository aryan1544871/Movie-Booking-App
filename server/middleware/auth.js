import { clerkClient } from "@clerk/express";
export const protectAdmin = async (req, res, next) => {
    try {
        const { userId } = req.auth();
        const user = await clerkClient.users.getUser(userId);
        if(user.publicMetadata.role !== 'admin'){
            return res.status(403).json({success: false, message: 'Access denied'});
        }
        next();
    } catch (error) {
         return res.status(401).json({success: false, message: error.message, userId: getAuth(req).userId});
    }
}