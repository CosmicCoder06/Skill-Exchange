// const Review = require("../models/Review");
// const Booking = require("../models/Booking");

// const getCurrentUserId = (req) => {
//     return (req.user._id || req.user.id).toString();
// };

// const calculateReviewStats = (reviews) => {
//     const total = reviews.length;

//     const average =
//         total > 0
//             ? reviews.reduce(
//                   (sum, review) => sum + review.rating,
//                   0
//               ) / total
//             : 0;

//     const distribution = {
//         5: 0,
//         4: 0,
//         3: 0,
//         2: 0,
//         1: 0
//     };

//     reviews.forEach((review) => {
//         if (distribution[review.rating] !== undefined) {
//             distribution[review.rating]++;
//         }
//     });

//     return {
//         average: Number(average.toFixed(1)),
//         total,
//         distribution
//     };
// };

// const createReview = async (req, res) => {
//     try {
//         const { bookingId, rating, comment } = req.body;

//         if (!bookingId) {
//             return res.status(400).json({
//                 message: "Booking ID is required"
//             });
//         }

//         const numericRating = Number(rating);

//         if (
//             !numericRating ||
//             numericRating < 1 ||
//             numericRating > 5
//         ) {
//             return res.status(400).json({
//                 message: "Rating must be between 1 and 5"
//             });
//         }

//         const booking = await Booking.findById(bookingId);

//         if (!booking) {
//             return res.status(404).json({
//                 message: "Booking not found"
//             });
//         }

//         const currentUserId = getCurrentUserId(req);
//         const mentorId = booking.mentor.toString();
//         const learnerId = booking.learner.toString();

//         if (
//             currentUserId !== mentorId &&
//             currentUserId !== learnerId
//         ) {
//             return res.status(403).json({
//                 message: "You are not part of this session"
//             });
//         }

//         if (booking.status !== "completed") {
//             return res.status(400).json({
//                 message:
//                     "You can review only a completed session"
//             });
//         }

//         const reviewee =
//             currentUserId === mentorId
//                 ? booking.learner
//                 : booking.mentor;

//         const existingReview = await Review.findOne({
//             booking: bookingId,
//             reviewer: currentUserId
//         });

//         if (existingReview) {
//             return res.status(400).json({
//                 message:
//                     "You have already reviewed this session"
//             });
//         }

//         const review = await Review.create({
//             booking: bookingId,
//             reviewer: currentUserId,
//             reviewee,
//             rating: numericRating,
//             comment: comment?.trim() || ""
//         });

//         const populatedReview = await Review.findById(
//             review._id
//         )
//             .populate(
//                 "reviewer reviewee",
//                 "name email role"
//             )
//             .populate(
//                 "booking",
//                 "mentor learner date time"
//             );

//         return res.status(201).json({
//             message: "Review submitted successfully",
//             review: populatedReview
//         });
//     } catch (error) {
//         console.error("Create review error:", error);

//         return res.status(500).json({
//             message: error.message
//         });
//     }
// };

// const getMyReviews = async (req, res) => {
//     try {
//         const currentUserId = getCurrentUserId(req);

//         const reviews = await Review.find({
//             reviewee: currentUserId
//         })
//             .populate(
//                 "reviewer",
//                 "name email role"
//             )
//             .populate(
//                 "booking",
//                 "mentor learner date time"
//             )
//             .sort({
//                 createdAt: -1
//             });

//         const stats = calculateReviewStats(reviews);

//         const totalGiven = await Review.countDocuments({
//             reviewer: currentUserId
//         });

//         return res.json({
//             stats: {
//                 average: stats.average,
//                 totalReceived: stats.total,
//                 totalGiven,
//                 distribution: stats.distribution
//             },
//             reviews
//         });
//     } catch (error) {
//         console.error("Get my reviews error:", error);

//         return res.status(500).json({
//             message: error.message
//         });
//     }
// };

// const getUserReviews = async (req, res) => {
//     try {
//         const userId = req.params.userId;

//         if (!userId) {
//             return res.status(400).json({
//                 message: "User ID is required"
//             });
//         }

//         const reviews = await Review.find({
//             reviewee: userId
//         })
//             .populate(
//                 "reviewer",
//                 "name email role"
//             )
//             .populate(
//                 "booking",
//                 "mentor learner date time"
//             )
//             .sort({
//                 createdAt: -1
//             });

//         const stats = calculateReviewStats(reviews);

//         return res.json({
//             stats: {
//                 average: stats.average,
//                 total: stats.total,
//                 distribution: stats.distribution
//             },
//             reviews
//         });
//     } catch (error) {
//         console.error("Get user reviews error:", error);

//         return res.status(500).json({
//             message: error.message
//         });
//     }
// };

// const getBookingReview = async (req, res) => {
//     try {
//         const currentUserId = getCurrentUserId(req);

//         const booking = await Booking.findById(
//             req.params.bookingId
//         );

//         if (!booking) {
//             return res.status(404).json({
//                 message: "Booking not found"
//             });
//         }

//         if (
//             booking.mentor.toString() !== currentUserId &&
//             booking.learner.toString() !== currentUserId
//         ) {
//             return res.status(403).json({
//                 message:
//                     "You are not part of this booking"
//             });
//         }

//         const review = await Review.findOne({
//             booking: req.params.bookingId,
//             reviewer: currentUserId
//         }).populate(
//             "reviewer reviewee",
//             "name email role"
//         );

//         return res.json({
//             review: review || null
//         });
//     } catch (error) {
//         console.error(
//             "Get booking review error:",
//             error
//         );

//         return res.status(500).json({
//             message: error.message
//         });
//     }
// };

// module.exports = {
//     createReview,
//     getMyReviews,
//     getUserReviews,
//     getBookingReview
// };



const Review = require("../models/Review");
const Booking = require("../models/Booking");

const getCurrentUserId = (req) => {
    return String(req.user._id || req.user.id);
};

const calculateReviewStats = (reviews) => {
    const total = reviews.length;

    const average =
        total > 0
            ? reviews.reduce(
                  (sum, review) =>
                      sum + review.rating,
                  0
              ) / total
            : 0;

    const distribution = {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
    };

    reviews.forEach((review) => {
        if (
            distribution[review.rating] !==
            undefined
        ) {
            distribution[review.rating]++;
        }
    });

    return {
        average: Number(
            average.toFixed(1)
        ),
        total,
        distribution
    };
};

// =====================================================
// CREATE REVIEW
// Learner -> Mentor only
// =====================================================

const createReview = async (req, res) => {
    try {
        const {
            bookingId,
            rating,
            comment
        } = req.body;

        if (!bookingId) {
            return res.status(400).json({
                message:
                    "Booking ID is required"
            });
        }

        const numericRating =
            Number(rating);

        if (
            !Number.isInteger(
                numericRating
            ) ||
            numericRating < 1 ||
            numericRating > 5
        ) {
            return res.status(400).json({
                message:
                    "Rating must be an integer between 1 and 5"
            });
        }

        const booking =
            await Booking.findById(
                bookingId
            );

        if (!booking) {
            return res.status(404).json({
                message:
                    "Booking not found"
            });
        }

        const currentUserId =
            getCurrentUserId(req);

        const learnerId =
            booking.learner.toString();

        const mentorId =
            booking.mentor.toString();

        // Only learner can review mentor
        if (
            currentUserId !== learnerId
        ) {
            return res.status(403).json({
                message:
                    "Only the learner can review the mentor"
            });
        }

        // Session must be completed
        if (
            booking.status !==
            "completed"
        ) {
            return res.status(400).json({
                message:
                    "You can review only a completed session"
            });
        }

        // One review per booking
        const existingReview =
            await Review.findOne({
                booking: bookingId,
                reviewer: currentUserId
            });

        if (existingReview) {
            return res.status(409).json({
                message:
                    "You have already reviewed this session"
            });
        }

        const review =
            await Review.create({
                booking: bookingId,
                reviewer: currentUserId,
                reviewee: booking.mentor,
                rating: numericRating,
                comment:
                    comment?.trim() || ""
            });

        const populatedReview =
            await Review.findById(
                review._id
            )
                .populate(
                    "reviewer reviewee",
                    "name email role avatarUrl"
                )
                .populate(
                    "booking",
                    "mentor learner date time status"
                );

        return res.status(201).json({
            message:
                "Review submitted successfully",
            review: populatedReview
        });

    } catch (error) {
        console.error(
            "Create review error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to submit review"
        });
    }
};

// =====================================================
// GET REVIEWS RECEIVED BY CURRENT USER
// =====================================================

const getMyReviews = async (req, res) => {
    try {
        const currentUserId =
            getCurrentUserId(req);

        const reviews =
            await Review.find({
                reviewee: currentUserId
            })
                .populate(
                    "reviewer",
                    "name email role avatarUrl"
                )
                .populate(
                    "booking",
                    "mentor learner date time status"
                )
                .sort({
                    createdAt: -1
                });

        const stats =
            calculateReviewStats(
                reviews
            );

        const totalGiven =
            await Review.countDocuments({
                reviewer: currentUserId
            });

        return res.json({
            stats: {
                average:
                    stats.average,
                totalReceived:
                    stats.total,
                totalGiven,
                distribution:
                    stats.distribution
            },
            reviews
        });

    } catch (error) {
        console.error(
            "Get my reviews error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to load reviews"
        });
    }
};

// =====================================================
// GET USER REVIEWS
// =====================================================

const getUserReviews = async (
    req,
    res
) => {
    try {
        const userId =
            req.params.userId;

        if (!userId) {
            return res.status(400).json({
                message:
                    "User ID is required"
            });
        }

        const reviews =
            await Review.find({
                reviewee: userId
            })
                .populate(
                    "reviewer",
                    "name email role avatarUrl"
                )
                .populate(
                    "booking",
                    "mentor learner date time status"
                )
                .sort({
                    createdAt: -1
                });

        const stats =
            calculateReviewStats(
                reviews
            );

        return res.json({
            stats: {
                average:
                    stats.average,
                total:
                    stats.total,
                distribution:
                    stats.distribution
            },
            reviews
        });

    } catch (error) {
        console.error(
            "Get user reviews error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to load user reviews"
        });
    }
};

// =====================================================
// GET REVIEW FOR A BOOKING
// =====================================================

const getBookingReview = async (
    req,
    res
) => {
    try {
        const currentUserId =
            getCurrentUserId(req);

        const booking =
            await Booking.findById(
                req.params.bookingId
            );

        if (!booking) {
            return res.status(404).json({
                message:
                    "Booking not found"
            });
        }

        if (
            booking.learner.toString() !==
            currentUserId &&
            booking.mentor.toString() !==
            currentUserId
        ) {
            return res.status(403).json({
                message:
                    "You are not part of this booking"
            });
        }

        const review =
            await Review.findOne({
                booking:
                    req.params.bookingId,
                reviewer:
                    currentUserId
            }).populate(
                "reviewer reviewee",
                "name email role avatarUrl"
            );

        return res.json({
            review:
                review || null
        });

    } catch (error) {
        console.error(
            "Get booking review error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to load booking review"
        });
    }
};

module.exports = {
    createReview,
    getMyReviews,
    getUserReviews,
    getBookingReview
};