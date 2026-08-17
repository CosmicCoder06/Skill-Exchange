const User = require("../../Models/UserSchema/user")


    async function getUser(req,res){

        try {
            const studentDetails= await User.find()
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