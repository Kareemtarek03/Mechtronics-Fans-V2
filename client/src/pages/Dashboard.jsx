import React, { useState, useEffect } from "react";
import {
    Box,
    Text,
    Heading,
    Grid,
    Button,
    Spinner,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api/auth";
import { FaFan, FaExchangeAlt, FaCog, FaHistory } from "react-icons/fa";
import { GiPipes } from "react-icons/gi";
import { MdAir } from "react-icons/md";

// Feature card data
const featureCards = [
    {
        id: "fan-selector",
        title: "Fan Selector",
        description: "Select and configure fans based on performance requirements.",
        icon: FaFan,
        path: "/fan-categories",
        buttonText: "Launch Selector",
        iconBg: "#3b82f6",
    },
    {
        id: "pipe-sizer",
        title: "Pipe Sizer",
        description: "Calculate required pipe dimensions for fluid flow.",
        icon: GiPipes,
        path: "/pipe-sizer",
        buttonText: "Launch Sizer",
        iconBg: "#10b981",
    },
    {
        id: "duct-sizer",
        title: "Duct Sizer",
        description: "Determine optimal duct sizes for HVAC systems.",
        icon: MdAir,
        path: "/duct-sizer",
        buttonText: "Launch Sizer",
        iconBg: "#f59e0b",
    },
    {
        id: "unit-converter",
        title: "Unit Converter",
        description: "Convert between various engineering units quickly and accurately.",
        icon: FaExchangeAlt,
        path: "/unit-converter",
        buttonText: "Launch Converter",
        iconBg: "#8b5cf6",
    },
];

// User Info Card Component
function UserInfoCard({ userData, loading, error }) {
    const navigate = useNavigate();

    if (loading) {
        return (
            <Box
                bg="#1e293b"
                borderRadius="xl"
                boxShadow="0 10px 30px rgba(0, 0, 0, 0.3)"
                border="1px solid #334155"
                p={6}
                mb={8}
                display="flex"
                alignItems="center"
                justifyContent="center"
                minH="120px"
            >
                <Spinner size="lg" color="#3b82f6" />
                <Text ml={4} color="#94a3b8" fontSize="md">
                    Loading user data...
                </Text>
            </Box>
        );
    }

    if (error) {
        return (
            <Box
                bg="#1e293b"
                borderRadius="xl"
                boxShadow="0 10px 30px rgba(0, 0, 0, 0.3)"
                border="1px solid #ef4444"
                p={6}
                mb={8}
                textAlign="center"
            >
                <Text color="#fca5a5" fontSize="md" fontWeight="medium">
                    ⚠️ {error}
                </Text>
            </Box>
        );
    }

    return (
        <Box
            bg="#1e293b"
            borderRadius="xl"
            boxShadow="0 10px 30px rgba(0, 0, 0, 0.3)"
            border="1px solid #334155"
            p={{ base: 4, md: 6 }}
            mb={8}
            display="flex"
            flexDirection={{ base: "column", md: "row" }}
            alignItems={{ base: "flex-start", md: "center" }}
            justifyContent="space-between"
            gap={4}
            transition="all 0.2s ease-in-out"
            _hover={{ boxShadow: "0 15px 40px rgba(59, 130, 246, 0.1)" }}
        >
            {/* User Info */}
            <Box display="flex" alignItems="center" gap={4}>
                <Box
                    style={{
                        width: "70px",
                        height: "70px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #e0a88a 0%, #c98b6a 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "3px solid #334155",
                    }}
                >
                    <Box
                        as="span"
                        fontSize="2xl"
                        color="white"
                        fontWeight="bold"
                    >
                        {userData?.firstName?.[0]?.toUpperCase() || "U"}
                    </Box>
                </Box>
                <Box>
                    <Heading
                        as="h2"
                        size="lg"
                        color="#ffffff"
                        fontWeight="600"
                        mb={1}
                        fontSize={{ base: "lg", md: "xl" }}
                    >
                        {userData?.firstName} {userData?.lastName}
                    </Heading>
                    <Text color="#94a3b8" fontSize={{ base: "sm", md: "md" }}>
                        {userData?.email}
                    </Text>
                </Box>
            </Box>

            {/* Action Buttons */}
            <Box display="flex" gap={3} flexWrap="wrap">
                <Button
                    bg="#334155"
                    color="#e2e8f0"
                    size="sm"
                    px={4}
                    py={2}
                    borderRadius="lg"
                    fontWeight="medium"
                    display="flex"
                    alignItems="center"
                    gap={2}
                    transition="all 0.2s ease-in-out"
                    _hover={{ bg: "#475569" }}
                    onClick={() => navigate("/profile")}
                >
                    <FaCog />
                    Profile Settings
                </Button>
                <Button
                    bg="#0ea5e9"
                    color="white"
                    size="sm"
                    px={4}
                    py={2}
                    borderRadius="lg"
                    fontWeight="medium"
                    display="flex"
                    alignItems="center"
                    gap={2}
                    transition="all 0.2s ease-in-out"
                    _hover={{ bg: "#0284c7" }}
                    onClick={() => navigate("/activity")}
                >
                    <FaHistory />
                    View Activity
                </Button>
            </Box>
        </Box>
    );
}

// Feature Card Component
function FeatureCard({ title, description, icon: IconComponent, path, buttonText, iconBg }) {
    const navigate = useNavigate();

    return (
        <Box
            bg="#1e293b"
            borderRadius="xl"
            boxShadow="0 10px 30px rgba(0, 0, 0, 0.3)"
            border="1px solid #334155"
            p={{ base: 4, md: 5 }}
            transition="all 0.3s ease-in-out"
            cursor="pointer"
            _hover={{
                boxShadow: "0 15px 40px rgba(59, 130, 246, 0.15)",
                transform: "translateY(-4px)",
                borderColor: "#3b82f6",
            }}
            onClick={() => navigate(path)}
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            minH="200px"
        >
            {/* Icon and Title */}
            <Box>
                <Box display="flex" alignItems="center" gap={3} mb={3}>
                    <Box
                        bg={iconBg}
                        borderRadius="lg"
                        p={3}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <IconComponent color="white" size={20} />
                    </Box>
                    <Heading
                        as="h3"
                        size="md"
                        color="#ffffff"
                        fontWeight="600"
                        fontSize={{ base: "md", md: "lg" }}
                    >
                        {title}
                    </Heading>
                </Box>

                {/* Description */}
                <Text
                    color="#94a3b8"
                    fontSize={{ base: "sm", md: "md" }}
                    lineHeight="1.6"
                    mb={4}
                >
                    {description}
                </Text>
            </Box>

            {/* Action Button */}
            <Button
                bg="#0ea5e9"
                color="white"
                size="md"
                w="100%"
                py={5}
                borderRadius="lg"
                fontWeight="semibold"
                transition="all 0.2s ease-in-out"
                _hover={{ bg: "#0284c7", transform: "scale(1.02)" }}
                _active={{ transform: "scale(0.98)" }}
                onClick={(e) => {
                    e.stopPropagation();
                    navigate(path);
                }}
            >
                {buttonText}
            </Button>
        </Box>
    );
}

// Main Dashboard Component
export default function Dashboard() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await authAPI.getCurrentUser();
                console.log("✅ Dashboard - User data fetched:", response.data.user);
                setUserData(response.data.user);
            } catch (err) {
                console.error("❌ Dashboard - Failed to fetch user data:", err);
                // Fallback to localStorage
                const fallbackData = {
                    firstName: localStorage.getItem("firstName") || "User",
                    lastName: localStorage.getItem("lastName") || "",
                    email: localStorage.getItem("email") || "user@example.com",
                };

                if (fallbackData.firstName !== "User" || fallbackData.email !== "user@example.com") {
                    console.log("📦 Dashboard - Using fallback data:", fallbackData);
                    setUserData(fallbackData);
                } else {
                    setError("Failed to load user data. Please try again.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    return (
        <Box
            bg="#0f172a"
            minH="100vh"
            py={{ base: 4, md: 6 }}
            px={{ base: 4, md: 6, lg: 8 }}
            pt={{ base: "100px", md: "120px" }}
        >
            <Box maxW="1200px" w="100%" mx="auto">
                {/* Page Title */}
                <Heading
                    as="h1"
                    size="2xl"
                    color="#ffffff"
                    fontWeight="bold"
                    mb={8}
                    fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
                >
                    Engineering Tools Dashboard
                </Heading>

                {/* User Info Card */}
                <UserInfoCard userData={userData} loading={loading} error={error} />

                {/* Feature Cards Grid */}
                <Grid
                    templateColumns={{
                        base: "1fr",
                        md: "repeat(2, 1fr)",
                        lg: "repeat(3, 1fr)",
                    }}
                    gap={{ base: 4, md: 6 }}
                >
                    {featureCards.map((card) => (
                        <FeatureCard
                            key={card.id}
                            title={card.title}
                            description={card.description}
                            icon={card.icon}
                            path={card.path}
                            buttonText={card.buttonText}
                            iconBg={card.iconBg}
                        />
                    ))}
                </Grid>
            </Box>
        </Box>
    );
}
