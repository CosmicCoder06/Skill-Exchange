const User = require("../Backend Configuration/Models/UserSchema/user");

const hasValue = (value) =>
    typeof value === "string" && value.trim().length > 0;

const hasSkill = (skills) =>
    Array.isArray(skills) && skills.some(hasValue);

const calculateProfileComplete = (profile) => Boolean(
    hasValue(profile.bio) &&
    hasSkill(profile.skillsToTeach) &&
    hasSkill(profile.skillsToLearn)
);



// ===============================
// GET MY PROFILE
// ===============================

const getMyProfile = async (req, res) => {

    try {

        const user = await User.findById(req.user.id)
            .select("-password -refreshToken");


        if (!user) {

            return res.status(404).json({
                message: "User not found"
            });

        }



        // The calculated fallback also supports profiles completed before the
        // profileCompleted field was introduced.
        const profileComplete = user.profileCompleted ||
            calculateProfileComplete(user);



        res.status(200).json({

            profile: user,

            profileComplete

        });



    } catch (error) {


        res.status(500).json({

            message:"Unable to fetch profile",

            error:error.message

        });


    }

};





// ===============================
// UPDATE PROFILE
// ===============================

const updateProfile = async (req,res)=>{


    try{


        const allowedFields=[

            "bio",
            "skillsToTeach",
            "skillsToLearn",
            "availability",
            "hourlyRate",
            "avatarUrl"

        ];



        const updates={};



        allowedFields.forEach(field=>{


            if(req.body[field] !== undefined){

                updates[field]=req.body[field];

            }


        });

        // The form validates these same required values before submitting.
        // Save the result so logging in again always uses the same answer.
        const profileComplete = calculateProfileComplete({
            ...req.body,
            skillsToTeach: updates.skillsToTeach,
            skillsToLearn: updates.skillsToLearn
        });

        if (profileComplete) {
            updates.profileCompleted = true;
        }




        const user = await User.findByIdAndUpdate(

            req.user.id,

            updates,

            {
                new:true
            }

        )
        .select("-password -refreshToken");




        res.status(200).json({

            message:"Profile updated successfully",

            profile:user,

            profileComplete: user.profileCompleted || profileComplete

        });



    }
    catch(error){


        res.status(500).json({

            message:"Profile update failed",

            error:error.message

        });


    }


};





// ===============================
// GET OTHER USER PROFILE
// ===============================

const getUserProfile = async(req,res)=>{


    try{


        const user = await User.findById(req.params.id)

        .select("-password -refreshToken");



        if(!user){

            return res.status(404).json({

                message:"User not found"

            });

        }



        res.status(200).json({

            profile:user

        });



    }
    catch(error){


        res.status(500).json({

            message:"Unable to fetch profile",

            error:error.message

        });


    }


};

const deactivateMyAccount = async (req, res) => {
    try {
        const reason = String(req.body?.reason || "").trim();
        if (!reason) return res.status(400).json({ message: "A deactivation reason is required" });

        await User.findByIdAndUpdate(req.user.id, {
            isActive: false,
            deactivationReason: reason,
            refreshToken: null
        });

        return res.status(200).json({ message: "Account deactivated" });
    } catch (error) {
        return res.status(500).json({ message: "Unable to deactivate account" });
    }
};





module.exports={

    getMyProfile,

    updateProfile,
    getUserProfile,
    deactivateMyAccount

};
// @teamcosmiccoders
