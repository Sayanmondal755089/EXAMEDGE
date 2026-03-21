import express from "express";
const router = express.Router();

router.post("/verify", async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "Access token missing"
      });
    }

    const response = await fetch(
      "https://control.msg91.com/api/v5/widget/verifyAccessToken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          authkey: process.env.MSG91_AUTH_KEY,
          "access-token": accessToken,
        }),
      }
    );

    const data = await response.json();

    console.log("MSG91 Response:", data);

    if (data.type === "success") {
      return res.json({
        success: true,
        message: "OTP Verified",
        data
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "OTP Failed",
        data
      });
    }

  } catch (error) {
    console.error("OTP ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
});

export default router;
