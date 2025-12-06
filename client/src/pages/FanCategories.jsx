import React, { useState } from "react";
import {
    Box,
    Text,
    Heading,
    Grid,
    Button,
    Input,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import axialFanImage from "../assets/axial-fan.png";
import centrifugalFanImage from "../assets/centrifugal-fan.jpg"

// Fan category data with placeholder images
const fanCategories = [
    {
        id: "axial",
        title: "Axial Fans",
        description: "High flow, low pressure fans for general ventilation.",
        image: axialFanImage,
        path: "/fan-selection",
        color: "#d4a574",
    },
    {
        id: "centrifugal",
        title: "Centrifugal Fans",
        description: "High pressure fans for ducted and industrial applications.",
        image: centrifugalFanImage,
        path: "/fan-selection",
        color: "#7eb8c9",
    },


];

// Category Card Component
function CategoryCard({ title, description, image, path, color }) {
    const navigate = useNavigate();

    return (
        <Box
            bg="#1e293b"
            borderRadius="xl"
            boxShadow="0 10px 30px rgba(0, 0, 0, 0.3)"
            border="1px solid #334155"
            overflow="hidden"
            transition="all 0.3s ease-in-out"
            cursor="pointer"
            _hover={{
                boxShadow: "0 15px 40px rgba(59, 130, 246, 0.15)",
                transform: "translateY(-4px)",
                borderColor: "#3b82f6",
            }}
            onClick={() => navigate(path)}
        >
            {/* Image Container */}
            <Box
                h="180px"
                overflow="hidden"
                position="relative"
                borderBottom={`3px solid ${color}`}
            >
                <Box
                    as="img"
                    src={image}
                    alt={title}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                    transition="transform 0.3s ease"
                    _hover={{ transform: "scale(1.05)" }}
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.style.background = `linear-gradient(135deg, ${color}40 0%, ${color}20 100%)`;
                        e.target.parentElement.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:3rem;">🌀</div>`;
                    }}
                />
            </Box>

            {/* Content */}
            <Box p={4}>
                <Heading
                    as="h3"
                    size="md"
                    color="#ffffff"
                    fontWeight="600"
                    fontSize={{ base: "md", md: "lg" }}
                    mb={2}
                >
                    {title}
                </Heading>
                <Text
                    color="#94a3b8"
                    fontSize={{ base: "sm", md: "md" }}
                    lineHeight="1.5"
                    mb={4}
                    minH="48px"
                >
                    {description}
                </Text>
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
                    Select
                </Button>
            </Box>
        </Box>
    );
}

// Main Fan Categories Component
export default function FanCategories() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredCategories = fanCategories.filter(
        (cat) =>
            cat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cat.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box
            bg="#0f172a"
            minH="100vh"
            py={{ base: 4, md: 6 }}
            px={{ base: 4, md: 6, lg: 8 }}
            pt={{ base: "100px", md: "120px" }}
        >
            <Box maxW="1200px" w="100%" mx="auto">
                {/* Breadcrumb */}
                <Text color="#94a3b8" fontSize="sm" mb={2}>
                    Home / Fan Selection
                </Text>

                {/* Page Title */}
                <Heading
                    as="h1"
                    size="2xl"
                    color="#ffffff"
                    fontWeight="bold"
                    mb={2}
                    fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
                >
                    Fan Selection Tools
                </Heading>

                <Text color="#94a3b8" fontSize="md" mb={6}>
                    Select a fan category to begin or use the search to find a specific model.
                </Text>

                {/* Search Bar */}
                <Box
                    bg="#1e293b"
                    borderRadius="lg"
                    border="1px solid #334155"
                    p={1}
                    mb={8}
                    maxW="500px"
                    display="flex"
                    alignItems="center"
                >
                    <Box pl={3} color="#64748b">
                        <FaSearch size={18} />
                    </Box>
                    <Input
                        placeholder="Search by fan model, series, or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        bg="transparent"
                        border="none"
                        color="#e2e8f0"
                        _placeholder={{ color: "#64748b" }}
                        _focus={{ boxShadow: "none", outline: "none" }}
                        px={3}
                        py={2}
                    />
                </Box>

                {/* Categories Grid */}
                <Grid
                    templateColumns={{
                        base: "1fr",
                        sm: "repeat(2, 1fr)",
                        lg: "repeat(4, 1fr)",
                    }}
                    gap={{ base: 4, md: 6 }}
                >
                    {filteredCategories.map((category) => (
                        <CategoryCard
                            key={category.id}
                            title={category.title}
                            description={category.description}
                            image={category.image}
                            path={category.path}
                            color={category.color}
                        />
                    ))}
                </Grid>

                {filteredCategories.length === 0 && (
                    <Box textAlign="center" py={12}>
                        <Text color="#94a3b8" fontSize="lg">
                            No categories found matching "{searchTerm}"
                        </Text>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
