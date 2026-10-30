const User = require("../../Models/UserSchema/user")


    async function getUser(req,res){

        try {
            // This endpoint feeds the new-chat member picker. Admin accounts
            // are deliberately excluded from the normal member directory.
            const studentDetails= await User.find({
                role: { $ne: "admin" },
                isActive: true
            })
            console.log(studentDetails)
            res.json({
                message:"Successfull data fetched from the Data base",
                data : studentDetails
            })
            
        } catch (error) {
            console.log(error.message)
        }
    }

    module.exports= getUser
// @teamcosmiccoders
