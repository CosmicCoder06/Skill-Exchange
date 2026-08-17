const User = require("../../Models/UserSchema/user")


    // async function getUser(req,res){

    //     try {
    //         const studentDetails= await User.find()
    //         console.log(studentDetails)
    //         res.json({
    //             message:"Successfull data fetched from the Data base",
    //             data : studentDetails
    //         })
            
    //     } catch (error) {
    //         console.log(error.message)
    //     }
    // }

    const updateUser=async (req,res)=>{
        try {

            const{name, email}=req.body

            const updatedUser= await User.findByIdAndUpdate(req.params.id,
                {name,email}
            )

            res.json({
                message:"successfully updated",
                data:updatedUser
            })

            console.log("data has been updated :" ,updateUser)
            
        } catch (error) {
            console.log(error)
        }
    }

    module.exports= updateUser