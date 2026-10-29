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
            const { id } = req.params;
            if (String(req.user?.id) !== String(id) && req.user?.role !== "admin") {
                return res.status(403).json({ success: false, message: "Unauthorized to update this user" });
            }

            const{name, email}=req.body

            const updatedUser= await User.findByIdAndUpdate(id,
                {name,email},
                { new: true }
            )

            res.json({
                message:"successfully updated",
                data:updatedUser
            })

            console.log("data has been updated :" ,updatedUser)
            
        } catch (error) {
            console.log(error)
            res.status(500).json({ success: false, message: "Server error" });
        }
    }

    module.exports= updateUser
// @teamcosmiccoders
