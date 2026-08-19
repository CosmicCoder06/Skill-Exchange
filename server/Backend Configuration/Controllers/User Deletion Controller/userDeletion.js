const User = require("../../Models/UserSchema/user")

const deletedUser= async(req,res)=>{ 

try {
        const {id}=req.params;
        if (String(req.user.id) !== String(id)) {
            return res.status(403).json({ success:false, message:"You can only delete your own account" });
        }
    await User.findByIdAndDelete(id)
    res.json({
    success:true,
    message:"User Has been Deleted"
   })
} catch (error) {
    console.log(error.message)
    res.json({
    success:false,
    message:"Server Error"
   })
}

}
module.exports = { deletedUser };
// @teamcosmiccoders
