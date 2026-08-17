const express= require("express")
const router= express.Router()
const getUser= require("../../Controllers/Get All User Controller/getUser") 
const verifyToken=require("../../Configuration Folders/Middleware Configuration/authMiddleware")
const authorize=require("../../Configuration Folders/Middleware Configuration/roleSpecificMiddleware")


router.get("/getData",verifyToken, getUser)
// router.get("/getData",verifyToken,authorize("admin"), getUser)
router.get("/getData/admin/api",verifyToken,authorize("admin"), (req,res)=>{
    res.json({
        message:"welcome Admin"

    })
})

router.get("/getData/api",verifyToken,authorize("student"), (req,res)=>{
    res.json({
        message:"welcome Student"
        

    })
})


module.exports= router;