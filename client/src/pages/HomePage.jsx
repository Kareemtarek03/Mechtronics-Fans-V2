import React, { useState } from "react";
import {
  Box,
  Stack,
  Input,
  Button,
  Heading,
  Text,
  Grid,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useFormData } from "../context/FormContext";
import UnitSelect from "../components/slectors.jsx";
import {
  airFlowUnits,
  pressureUnits,
  powerUnits,
  fanTypeUnits,
  NoPhases,
} from "../utils/units.js";

export default function HomePage() {
  const navigate = useNavigate();
  const { units, setUnits, input, setInput, setResults } = useFormData();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const DEFAULTS = {
    units: { airFlow: "CFM", pressure: "Pa", power: "kW", fanType: "AF-L" },
    input: { RPM: 1440, TempC: 20, NoPhases: 3, SPF: 5, Safety: 5 },
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!input.airFlow || !input.staticPressure) {
      setMessage({
        type: "warning",
        text: "Please provide both Air Flow and Static Pressure.",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    const payload = {
      units: {
        airFlow: units.airFlow || DEFAULTS.units.airFlow,
        pressure: units.pressure || DEFAULTS.units.pressure,
        power: units.power || DEFAULTS.units.power,
        fanType: units.fanType || DEFAULTS.units.fanType,
      },
      input: {
        RPM: parseFloat(input.RPM) || DEFAULTS.input.RPM,
        TempC: parseFloat(input.TempC) || DEFAULTS.input.TempC,
        airFlow: parseFloat(input.airFlow),
        NoPhases: parseFloat(input.NoPhases) || DEFAULTS.input.NoPhases,
        staticPressure: parseFloat(input.staticPressure),
        SPF: parseInt(input.SPF) || DEFAULTS.input.SPF,
        Safety: parseInt(input.Safety) || DEFAULTS.input.Safety,
      },
    };

    try {
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || "";
      const resp = await fetch(`${apiBaseUrl}/api/fan-data/filter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (resp.ok) {
        const data = await resp.json();
        // Save results to context
        setResults({ data, payload, units });
        navigate("/results");
      } else {
        const text = await resp.text();
        throw new Error(`API error: ${resp.status} ${text}`);
      }
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: err.message || "Failed to process fan data.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDefaultForField = (type, name) => {
    return DEFAULTS[type][name];
  };

  const handleClearAll = () => {
    setInput({
      RPM: DEFAULTS.input.RPM,
      TempC: DEFAULTS.input.TempC,
      airFlow: "",
      staticPressure: "",
      NoPhases: DEFAULTS.input.NoPhases,
      SPF: DEFAULTS.input.SPF,
      Safety: DEFAULTS.input.Safety,
      directivityFactor: 2,
      distanceFromSource: 1,
    });
    setUnits({
      airFlow: DEFAULTS.units.airFlow,
      pressure: DEFAULTS.units.pressure,
      power: DEFAULTS.units.power,
      fanType: DEFAULTS.units.fanType,
    });
    setMessage(null);
  };

  return (
    <Box
      bg="#0f172a"
      minH="100vh"
      py={{ base: 1, md: 2, lg: 2 }}
      px={{ base: 2, md: 3, lg: 3 }}
      pt="160px"
      mt={"80px"}
    >
      <Box maxW="1200px" w="100%" mx="auto" mt={{ base: 4, md: 6, lg: 8 }}>
        {/* Page Header */}

        <Box
          display="grid"
          gridTemplateColumns={{ base: "1fr", md: "1fr", lg: "1fr 320px" }}
          gap={{ base: 4, md: 8 }}
          w="100%"
        >
          {/* Main Form */}
          <Box
            bg="#1e293b"
            borderRadius="0.75rem"
            boxShadow="0 10px 30px rgba(0, 0, 0, 0.3)"
            border="1px"
            borderColor="#334155"
            transition="all 0.2s ease-in-out"
            _hover={{ boxShadow: "0 15px 40px rgba(59, 130, 246, 0.1)" }}
            w="100%"
          >
            <Box p={{ base: 2, md: 2, lg: 3 }} w="100%" overflowX="hidden">
              {/* Hint Message */}
              <Box
                bgGradient="linear(135deg, #3b82f6 0%, #2563eb 100%)"
                color="white"
                p={4}
                borderRadius="12px"
                mb={5}
                display="flex"
                alignItems="center"
                gap={3}
                boxShadow="0 4px 12px rgba(59, 130, 246, 0.3)"
                border="1px solid rgba(255, 255, 255, 0.2)"
              >
                <Box fontSize="2xl">💡</Box>
                <Text fontSize="sm" fontWeight="500" lineHeight="1.6">
                  Fill in the required fields below and click "Find Fans" to
                  search for suitable fan models.
                </Text>
              </Box>

              <form onSubmit={handleSubmit}>
                <Stack spacing={{ base: 3, md: 3 }} w="100%">
                  {/* Section 1: Basic Parameters */}
                  <Box w="100%">
                    <Heading
                      size="sm"
                      color="#ffffff"
                      mb={3}
                      pb={2}
                      borderBottom="2px"
                      borderColor="#3b82f6"
                      fontWeight="600"
                      fontSize={{ base: "md", md: "lg" }}
                      display="flex"
                      alignItems="center"
                      gap={2}
                    >
                      <Box as="span" color="#3b82f6">
                        ⚙️
                      </Box>
                      Basic Parameters
                    </Heading>
                    <Grid
                      templateColumns={{
                        base: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(3, 1fr)",
                      }}
                      gap={{ base: 2, md: 2 }}
                      w="100%"
                      mt={1}
                    >
                      <Box>
                        <Text
                          fontWeight="semibold"
                          mb={0.5}
                          color="#e2e8f0"
                          fontSize="xs"
                        >
                          Rotational Speed
                        </Text>
                        {!input.RPM &&
                          getDefaultForField("input", "RPM") !== undefined && (
                            <Text fontSize="xs" color="#94a3b8" mb={1}>
                              Default: {getDefaultForField("input", "RPM")}
                            </Text>
                          )}
                        <Input
                          name="RPM"
                          type="number"
                          value={input.RPM || ""}
                          onChange={handleInputChange}
                          placeholder="e.g. 1800"
                          bg="#0f172a"
                          color="#e2e8f0"
                          border="1px"
                          borderColor="#334155"
                          _placeholder={{ color: "#94a3b8" }}
                          _focus={{
                            borderColor: "#3b82f6",
                            bg: "#1e293b",
                            boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                          }}
                          _hover={{ borderColor: "#475569" }}
                          transition="all 0.2s ease-in-out"
                        />
                      </Box>
                      <Box>
                        <Text
                          fontWeight="semibold"
                          mb={2}
                          color="#e2e8f0"
                          fontSize="sm"
                        >
                          Temperature (°C)
                        </Text>
                        {!input.TempC &&
                          getDefaultForField("input", "TempC") !==
                          undefined && (
                            <Text fontSize="xs" color="#94a3b8" mb={1}>
                              Default: {getDefaultForField("input", "TempC")}
                            </Text>
                          )}
                        <Input
                          name="TempC"
                          type="number"
                          value={input.TempC || ""}
                          onChange={handleInputChange}
                          placeholder="e.g. 25"
                          bg="#0f172a"
                          color="#e2e8f0"
                          border="1px"
                          borderColor="#334155"
                          _placeholder={{ color: "#94a3b8" }}
                          _focus={{
                            borderColor: "#3b82f6",
                            bg: "#1e293b",
                            boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                          }}
                          _hover={{ borderColor: "#475569" }}
                          transition="all 0.2s ease-in-out"
                        />
                      </Box>
                      <Box>
                        <Text
                          fontWeight="semibold"
                          mb={2}
                          color="#e2e8f0"
                          fontSize="sm"
                        >
                          Fan Type
                        </Text>
                        {!units.fanType &&
                          getDefaultForField("units", "fanType") && (
                            <Text fontSize="xs" color="#94a3b8" mb={1}>
                              Default: {getDefaultForField("units", "fanType")}
                            </Text>
                          )}
                        <UnitSelect
                          name="fanType"
                          collection={fanTypeUnits}
                          value={units.fanType}
                          onChange={(v) =>
                            setUnits((u) => ({ ...u, fanType: v }))
                          }
                          placeholder="Select Fan Type"
                        />
                      </Box>
                    </Grid>
                  </Box>

                  {/* Section 2: Airflow Configuration */}
                  <Box w="100%" mt={4}>
                    <Heading
                      size="sm"
                      color="#ffffff"
                      mb={3}
                      pb={2}
                      borderBottom="2px"
                      borderColor="#3b82f6"
                      fontWeight="600"
                      fontSize={{ base: "md", md: "lg" }}
                      display="flex"
                      alignItems="center"
                      gap={2}
                    >
                      <Box as="span" color="#3b82f6">
                        💨
                      </Box>
                      Airflow Configuration
                    </Heading>
                    <Box
                      bg="#0f172a"
                      borderRadius="lg"
                      p={{ base: 2, md: 2 }}
                      border="1px"
                      borderColor="#334155"
                      w="100%"
                      mt={1}
                    >
                      <Grid
                        templateColumns={{ base: "1fr", md: "1fr 2fr" }}
                        gap={{ base: 2, md: 2 }}
                        w="100%"
                      >
                        <Box>
                          <Text
                            fontSize="sm"
                            mb={2}
                            color="#e2e8f0"
                            fontWeight="medium"
                          >
                            Unit
                          </Text>
                          {!units.airFlow &&
                            getDefaultForField("units", "airFlow") && (
                              <Text fontSize="xs" color="#94a3b8" mb={1}>
                                Default:{" "}
                                {getDefaultForField("units", "airFlow")}
                              </Text>
                            )}
                          <UnitSelect
                            name="airFlow"
                            collection={airFlowUnits}
                            value={units.airFlow}
                            onChange={(v) =>
                              setUnits((u) => ({ ...u, airFlow: v }))
                            }
                            placeholder="Select air flow"
                          />
                        </Box>
                        <Box>
                          <Text
                            fontSize="sm"
                            mb={2}
                            color="#e2e8f0"
                            fontWeight="medium"
                          >
                            Value
                          </Text>

                          <Input
                            name="airFlow"
                            type="number"
                            value={input.airFlow || ""}
                            onChange={handleInputChange}
                            placeholder="e.g. 35000"
                            bg="#1e293b"
                            color="#e2e8f0"
                            border="1px"
                            borderColor="#334155"
                            _placeholder={{ color: "#94a3b8" }}
                            _focus={{
                              borderColor: "#3b82f6",
                              bg: "#1e293b",
                              boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                            }}
                            _hover={{ borderColor: "#475569" }}
                            transition="all 0.2s ease-in-out"
                          />
                        </Box>
                      </Grid>
                    </Box>
                  </Box>

                  {/* Section 3: Pressure Configuration */}
                  <Box w="100%" mt={4}>
                    <Heading
                      size="sm"
                      color="#ffffff"
                      mb={3}
                      pb={2}
                      borderBottom="2px"
                      borderColor="#3b82f6"
                      fontWeight="600"
                      fontSize={{ base: "md", md: "lg" }}
                      display="flex"
                      alignItems="center"
                      gap={2}
                    >
                      <Box as="span" color="#3b82f6">
                        📊
                      </Box>
                      Pressure Configuration
                    </Heading>
                    <Box
                      bg="#0f172a"
                      borderRadius="lg"
                      p={{ base: 2, md: 2 }}
                      border="1px"
                      borderColor="#334155"
                      w="100%"
                      mt={1}
                    >
                      <Grid
                        templateColumns={{ base: "1fr", md: "1fr 2fr" }}
                        gap={{ base: 2, md: 2 }}
                        w="100%"
                      >
                        <Box>
                          <Text
                            fontSize="sm"
                            mb={2}
                            color="#e2e8f0"
                            fontWeight="medium"
                          >
                            Unit
                          </Text>
                          {!units.pressure &&
                            getDefaultForField("units", "pressure") && (
                              <Text fontSize="xs" color="#94a3b8" mb={1}>
                                Default:{" "}
                                {getDefaultForField("units", "pressure")}
                              </Text>
                            )}
                          <UnitSelect
                            name="pressure"
                            collection={pressureUnits}
                            value={units.pressure}
                            onChange={(v) =>
                              setUnits((u) => ({ ...u, pressure: v }))
                            }
                            placeholder="Select pressure"
                          />
                        </Box>
                        <Box>
                          <Text
                            fontSize="sm"
                            mb={2}
                            color="#e2e8f0"
                            fontWeight="medium"
                          >
                            Value
                          </Text>
                          <Input
                            name="staticPressure"
                            type="number"
                            value={input.staticPressure || ""}
                            onChange={handleInputChange}
                            placeholder="e.g. 500"
                            bg="#1e293b"
                            color="#e2e8f0"
                            border="1px"
                            borderColor="#334155"
                            _placeholder={{ color: "#94a3b8" }}
                            _focus={{
                              borderColor: "#3b82f6",
                              bg: "#1e293b",
                              boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                            }}
                            _hover={{ borderColor: "#475569" }}
                            transition="all 0.2s ease-in-out"
                          />
                        </Box>
                      </Grid>
                    </Box>
                  </Box>

                  {/* Section 4: Power Configuration */}
                  <Box w="100%" mt={4}>
                    <Heading
                      size="sm"
                      color="#ffffff"
                      mb={3}
                      pb={2}
                      borderBottom="2px"
                      borderColor="#3b82f6"
                      fontWeight="600"
                      fontSize={{ base: "md", md: "lg" }}
                      display="flex"
                      alignItems="center"
                      gap={2}
                    >
                      <Box as="span" color="#3b82f6">
                        ⚡
                      </Box>
                      Power & Phase Configuration
                    </Heading>
                    <Box
                      bg="#0f172a"
                      borderRadius="lg"
                      p={{ base: 3, md: 3 }}
                      border="1px"
                      borderColor="#334155"
                      w="100%"
                      mt={2}
                    >
                      <Grid
                        templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                        gap={{ base: 3, md: 3 }}
                        w="100%"
                      >
                        <Box>
                          <Text
                            fontSize="sm"
                            mb={2}
                            color="#e2e8f0"
                            fontWeight="medium"
                          >
                            Unit
                          </Text>
                          {!units.power &&
                            getDefaultForField("units", "power") && (
                              <Text fontSize="xs" color="#94a3b8" mb={1}>
                                Default: {getDefaultForField("units", "power")}
                              </Text>
                            )}
                          <UnitSelect
                            name="power"
                            collection={powerUnits}
                            value={units.power}
                            onChange={(v) =>
                              setUnits((u) => ({ ...u, power: v }))
                            }
                            placeholder="Select power"
                          />
                        </Box>
                        <Box>
                          <Text
                            fontSize="sm"
                            mb={2}
                            color="#e2e8f0"
                            fontWeight="medium"
                          >
                            Number of Phases
                          </Text>
                          {!input.NoPhases &&
                            getDefaultForField("input", "NoPhases") && (
                              <Text fontSize="xs" color="#94a3b8" mb={1}>
                                Default:{" "}
                                {getDefaultForField("input", "NoPhases")}
                              </Text>
                            )}
                          <UnitSelect
                            name="NoPhases"
                            collection={NoPhases}
                            value={input.NoPhases}
                            onChange={(v) =>
                              setInput((u) => ({ ...u, NoPhases: v }))
                            }
                            placeholder="Select Number of Phases "
                          />
                        </Box>
                      </Grid>
                    </Box>
                  </Box>

                  {/* Section 5: Safety Factors */}
                  <Box w="100%" mt={4}>
                    <Heading
                      size="sm"
                      color="#ffffff"
                      mb={3}
                      pb={2}
                      borderBottom="2px"
                      borderColor="#3b82f6"
                      fontWeight="600"
                      fontSize={{ base: "md", md: "lg" }}
                      display="flex"
                      alignItems="center"
                      gap={2}
                    >
                      <Box as="span" color="#3b82f6">
                        🛡️
                      </Box>
                      Safety Factors
                    </Heading>
                    <Box
                      bg="#0f172a"
                      borderRadius="lg"
                      p={{ base: 3, md: 3 }}
                      border="1px"
                      borderColor="#334155"
                      w="100%"
                      mt={2}
                    >
                      <Grid
                        templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                        gap={{ base: 3, md: 3 }}
                        w="100%"
                      >
                        <Box>
                          <Text
                            fontSize="sm"
                            mb={2}
                            color="#e2e8f0"
                            fontWeight="medium"
                          >
                            Static Pressure Variance (%)
                          </Text>
                          {!input.SPF && getDefaultForField("input", "SPF") && (
                            <Text fontSize="xs" color="#94a3b8" mb={1}>
                              Default: {getDefaultForField("input", "SPF")}
                            </Text>
                          )}
                          <Input
                            name="SPF"
                            type="number"
                            value={input.SPF || ""}
                            onChange={handleInputChange}
                            placeholder="Default: 5%"
                            bg="#1e293b"
                            color="#e2e8f0"
                            border="1px"
                            borderColor="#334155"
                            _placeholder={{ color: "#94a3b8" }}
                            _focus={{
                              borderColor: "#3b82f6",
                              bg: "#1e293b",
                              boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                            }}
                            _hover={{ borderColor: "#475569" }}
                            transition="all 0.2s ease-in-out"
                          />
                        </Box>
                        <Box>
                          <Text
                            fontSize="sm"
                            mb={2}
                            color="#e2e8f0"
                            fontWeight="medium"
                          >
                            S.P.F (%)
                          </Text>
                          {!input.Safety &&
                            getDefaultForField("input", "Safety") && (
                              <Text fontSize="xs" color="#94a3b8" mb={1}>
                                Default: {getDefaultForField("input", "Safety")}
                              </Text>
                            )}
                          <Input
                            name="Safety"
                            type="number"
                            value={input.Safety || ""}
                            onChange={handleInputChange}
                            placeholder="Default: 5%"
                            bg="#1e293b"
                            color="#e2e8f0"
                            border="1px"
                            borderColor="#334155"
                            _placeholder={{ color: "#94a3b8" }}
                            _focus={{
                              borderColor: "#3b82f6",
                              bg: "#1e293b",
                              boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                            }}
                            _hover={{ borderColor: "#475569" }}
                            transition="all 0.2s ease-in-out"
                          />
                        </Box>
                      </Grid>
                    </Box>
                  </Box>

                  {/* Section 6: Sound Data */}
                  <Box w="100%" mt={4}>
                    <Heading
                      size="sm"
                      color="#ffffff"
                      mb={3}
                      pb={2}
                      borderBottom="2px"
                      borderColor="#3b82f6"
                      fontWeight="600"
                      fontSize={{ base: "md", md: "lg" }}
                      display="flex"
                      alignItems="center"
                      gap={2}
                    >
                      <Box as="span" color="#3b82f6">
                        🔊
                      </Box>
                      Sound Data
                    </Heading>
                    <Box
                      bg="#0f172a"
                      borderRadius="lg"
                      p={{ base: 3, md: 3 }}
                      border="1px"
                      borderColor="#334155"
                      w="100%"
                      mt={2}
                    >
                      <Grid
                        templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                        gap={{ base: 3, md: 3 }}
                        w="100%"
                      >
                        <Box>
                          <Text
                            fontSize="sm"
                            mb={2}
                            color="#e2e8f0"
                            fontWeight="medium"
                          >
                            Directivity Factor (Q)
                          </Text>
                          <Text fontSize="xs" color="#94a3b8" mb={1}>
                            Default: 2
                          </Text>
                          <select
                            name="directivityFactor"
                            value={input.directivityFactor || 2}
                            onChange={(e) =>
                              setInput((prev) => ({
                                ...prev,
                                directivityFactor: parseFloat(e.target.value),
                              }))
                            }
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              backgroundColor: "#1e293b",
                              color: "#e2e8f0",
                              border: "1px solid #334155",
                              borderRadius: "6px",
                              fontSize: "14px",
                              cursor: "pointer",
                              outline: "none",
                            }}
                          >
                            <option value={1} style={{ background: "#1e293b" }}>1</option>
                            <option value={2} style={{ background: "#1e293b" }}>2</option>
                            <option value={4} style={{ background: "#1e293b" }}>4</option>
                            <option value={8} style={{ background: "#1e293b" }}>8</option>
                          </select>
                        </Box>
                        <Box>
                          <Text
                            fontSize="sm"
                            mb={2}
                            color="#e2e8f0"
                            fontWeight="medium"
                          >
                            Distance from Source (m)
                          </Text>
                          <Text fontSize="xs" color="#94a3b8" mb={1}>
                            Default: 1m
                          </Text>
                          <select
                            name="distanceFromSource"
                            value={input.distanceFromSource || 1}
                            onChange={(e) =>
                              setInput((prev) => ({
                                ...prev,
                                distanceFromSource: parseFloat(e.target.value),
                              }))
                            }
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              backgroundColor: "#1e293b",
                              color: "#e2e8f0",
                              border: "1px solid #334155",
                              borderRadius: "6px",
                              fontSize: "14px",
                              cursor: "pointer",
                              outline: "none",
                            }}
                          >
                            <option value={1} style={{ background: "#1e293b" }}>1</option>
                            <option value={1.5} style={{ background: "#1e293b" }}>1.5</option>
                            <option value={2} style={{ background: "#1e293b" }}>2</option>
                            <option value={3} style={{ background: "#1e293b" }}>3</option>
                            <option value={4} style={{ background: "#1e293b" }}>4</option>
                            <option value={5} style={{ background: "#1e293b" }}>5</option>
                            <option value={6} style={{ background: "#1e293b" }}>6</option>
                            <option value={7} style={{ background: "#1e293b" }}>7</option>
                            <option value={8} style={{ background: "#1e293b" }}>8</option>
                            <option value={9} style={{ background: "#1e293b" }}>9</option>
                            <option value={10} style={{ background: "#1e293b" }}>10</option>
                          </select>
                        </Box>
                      </Grid>
                    </Box>
                  </Box>

                  {/* Error/Warning Message */}
                  {message && (
                    <Box
                      bg={
                        message.type === "error"
                          ? "rgba(239, 68, 68, 0.1)"
                          : message.type === "warning"
                            ? "rgba(245, 158, 11, 0.1)"
                            : "rgba(34, 197, 94, 0.1)"
                      }
                      borderRadius="lg"
                      p={4}
                      textAlign="center"
                      color={
                        message.type === "error"
                          ? "#fca5a5"
                          : message.type === "warning"
                            ? "#fcd34d"
                            : "#86efac"
                      }
                      fontWeight="medium"
                      fontSize="sm"
                      border="1px"
                      borderColor={
                        message.type === "error"
                          ? "#dc2626"
                          : message.type === "warning"
                            ? "#d97706"
                            : "#16a34a"
                      }
                      transition="all 0.2s ease-in-out"
                    >
                      {message.text}
                    </Box>
                  )}

                  {/* Buttons Row */}
                  <Box display="flex" gap={1.5} w="100%" mt={1}>
                    <Button
                      bg="#3b82f6"
                      color="white"
                      type="submit"
                      size="xs"
                      isLoading={loading}
                      px={4}
                      py={2}
                      borderRadius="md"
                      transition="all 0.2s ease-in-out"
                      _hover={{
                        bg: "#2563eb",
                        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                      }}
                      _active={{ transform: "scale(0.98)" }}
                      fontWeight="semibold"
                      fontSize="xs"
                      h="auto"
                    >
                      Find Fans
                    </Button>
                    <Button
                      border="1px"
                      borderColor="#64748b"
                      color="#cbd5e1"
                      type="button"
                      size="xs"
                      onClick={handleClearAll}
                      px={2}
                      py={0.5}
                      borderRadius="md"
                      bg="transparent"
                      transition="all 0.2s ease-in-out"
                      _hover={{ bg: "#334155", borderColor: "#94a3b8" }}
                      _active={{ transform: "scale(0.98)" }}
                      fontWeight="semibold"
                      fontSize="xs"
                      h="auto"
                    >
                      Clear All
                    </Button>
                  </Box>
                </Stack>
              </form>
            </Box>
          </Box>

          {/* Right Sidebar - Summary Card */}
          <Box
            bg="#1e293b"
            borderRadius="0.75rem"
            boxShadow="0 10px 30px rgba(0, 0, 0, 0.3)"
            border="1px"
            borderColor="#334155"
            p={{ base: 3, md: 4 }}
            height="fit-content"
            position={{ base: "relative", lg: "sticky" }}
            top={{ base: "auto", lg: "100px" }}
            transition="all 0.2s ease-in-out"
            w="100%"
            ml={{ base: 0, lg: 6 }}
          >
            <Heading
              size="sm"
              color="#f8fafc"
              mb={2}
              fontWeight="bold"
              fontSize={{ base: "xs", md: "sm" }}
            >
              📋 Summary
            </Heading>

            {/* Summary Items - Key Value Pairs */}
            <Stack spacing={1.5}>
              {/* Air Flow */}
              <Box borderBottom="1px" borderColor="#334155" pb={1}>
                <Text fontSize="xs" color="#94a3b8" mb={0} fontWeight="medium">
                  Airflow
                </Text>
                <Text fontSize="xs" color="#e2e8f0" fontWeight="semibold">
                  {input.airFlow
                    ? `${input.airFlow} ${units.airFlow || "CFM"}`
                    : "—"}
                </Text>
              </Box>

              {/* Static Pressure */}
              <Box borderBottom="1px" borderColor="#334155" pb={1}>
                <Text fontSize="xs" color="#94a3b8" mb={0} fontWeight="medium">
                  Static Pressure
                </Text>
                <Text fontSize="xs" color="#e2e8f0" fontWeight="semibold">
                  {input.staticPressure
                    ? `${input.staticPressure} ${units.pressure || "Pa"}`
                    : "—"}
                </Text>
              </Box>

              {/* Fan Type */}
              <Box borderBottom="1px" borderColor="#334155" pb={1}>
                <Text fontSize="xs" color="#94a3b8" mb={0} fontWeight="medium">
                  Fan Type
                </Text>
                <Text fontSize="xs" color="#e2e8f0" fontWeight="semibold">
                  {units.fanType || "—"}
                </Text>
              </Box>

              {/* RPM */}
              <Box borderBottom="1px" borderColor="#334155" pb={1}>
                <Text fontSize="xs" color="#94a3b8" mb={0} fontWeight="medium">
                  Rotational Speed
                </Text>
                <Text fontSize="xs" color="#e2e8f0" fontWeight="semibold">
                  {input.RPM || "—"} RPM
                </Text>
              </Box>

              {/* Temperature */}
              <Box borderBottom="1px" borderColor="#334155" pb={1}>
                <Text fontSize="xs" color="#94a3b8" mb={0} fontWeight="medium">
                  Temperature
                </Text>
                <Text fontSize="xs" color="#e2e8f0" fontWeight="semibold">
                  {input.TempC || "—"}°C
                </Text>
              </Box>

              {/* Power Unit */}
              <Box borderBottom="1px" borderColor="#334155" pb={1}>
                <Text fontSize="xs" color="#94a3b8" mb={0} fontWeight="medium">
                  Power Unit
                </Text>
                <Text fontSize="xs" color="#e2e8f0" fontWeight="semibold">
                  {units.power || "—"}
                </Text>
              </Box>

              {/* Number of Phases */}
              <Box borderBottom="1px" borderColor="#334155" pb={1}>
                <Text fontSize="xs" color="#94a3b8" mb={0} fontWeight="medium">
                  Number of Phases
                </Text>
                <Text fontSize="xs" color="#e2e8f0" fontWeight="semibold">
                  {input.NoPhases || "—"}
                </Text>
              </Box>

              {/* SPF */}
              <Box borderBottom="1px" borderColor="#334155" pb={1}>
                <Text fontSize="xs" color="#94a3b8" mb={0} fontWeight="medium">
                  Static Pressure Variance
                </Text>
                <Text fontSize="xs" color="#e2e8f0" fontWeight="semibold">
                  {input.SPF || "—"}%
                </Text>
              </Box>

              {/* Safety */}
              <Box borderBottom="1px" borderColor="#334155" pb={1}>
                <Text fontSize="xs" color="#94a3b8" mb={0} fontWeight="medium">
                  Safety Factor
                </Text>
                <Text fontSize="xs" color="#e2e8f0" fontWeight="semibold">
                  {input.Safety || "—"}%
                </Text>
              </Box>

              {/* Helpful Tips */}
              <Box pt={1}>
                <Text fontSize="xs" color="#94a3b8" mb={1} fontWeight="medium">
                  💡 Tips
                </Text>
                <Stack spacing={0.5} fontSize="xs" color="#cbd5e1">
                  <Text>• Fill in Air Flow and Pressure to search</Text>
                  <Text>• Use default values for quick start</Text>
                  <Text>• Safety factors ensure optimal performance</Text>
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
