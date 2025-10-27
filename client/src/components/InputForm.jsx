import React, { useState } from "react";
import { Box, Stack, Input, Button, Heading, Text } from "@chakra-ui/react";

import UnitSelect from "./slectors.jsx";
import {
  airFlowUnits,
  pressureUnits,
  powerUnits,
  fanTypeUnits,
  NoPhases,
} from "../utils/units.js";

// import { Card, CardBody } from "@chakra-ui/react/card";

export default function ProcessFanDataForm() {
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState({
    airFlow: null,
    pressure: null,
    power: null,
    fanType: null,
  });
  const [input, setInput] = useState({
    RPM: null,
    TempC: null,
    airFlow: null,
    staticPressure: null,
    NoPhases: null,
    Safety: null,
  });
  const [result, setResult] = useState(null);
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
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '';
      const resp = await fetch(
        `${apiBaseUrl}/api/fan-data/filter`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`API error: ${resp.status} ${text}`);
      }

      const data = await resp.json();

      // Accept responses that include success/message/computed, but be defensive
      setResult({ ...data, payload });
      setMessage({ type: "success", text: data.message || "Processed." });
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: err.message || "Failed to process fan data.",
      });
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (v) => {
    if (v === null || v === undefined) return "-";
    if (typeof v === "number")
      return v.toLocaleString(undefined, { maximumFractionDigits: 6 });
    return String(v);
  };

  const getDefaultForField = (type, name) => {
    return DEFAULTS[type][name];
  };

  return (
    <>
      <Box mx="auto" p={8}>
        <Heading size="xl" textAlign="center" color={"black"} mb={6}>
          Input Data
        </Heading>

        <form onSubmit={handleSubmit}>
          <Stack spacing={6}>
            {/* Units */}

            <Stack direction={{ base: "column", md: "row" }} mb={10}>
              <Box flex={1}>
                <Box flex="1">
                  <Text fontWeight="semibold" mb={2}>
                    Rotational Speed
                  </Text>
                  {!input.RPM &&
                    getDefaultForField("input", "RPM") !== undefined && (
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Default: {getDefaultForField("input", "RPM")}
                      </Text>
                    )}
                  <Input
                    name="RPM"
                    type="number"
                    value={input.RPM}
                    onChange={handleInputChange}
                    placeholder="e.g. 1800"
                  />
                </Box>
              </Box>
              <Box flex="1">
                <Text fontWeight="semibold" mb={2}>
                  Temperature (°C)
                </Text>
                {!input.TempC &&
                  getDefaultForField("input", "TempC") !== undefined && (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Default: {getDefaultForField("input", "TempC")}
                    </Text>
                  )}
                <Input
                  name="TempC"
                  type="number"
                  value={input.TempC}
                  onChange={handleInputChange}
                  placeholder="e.g. 25"
                />
              </Box>
              <Box flex={1}>
                <Text fontWeight={"semibold"} mb={2}>
                  Fan Type
                </Text>
                {!units.fanType && getDefaultForField("units", "fanType") && (
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Default: {getDefaultForField("units", "fanType")}
                  </Text>
                )}
                <UnitSelect
                  name="fanType"
                  collection={fanTypeUnits}
                  value={units.fanType}
                  onChange={(v) => setUnits((u) => ({ ...u, fanType: v }))}
                  placeholder="Select Fan Type"
                />
              </Box>
            </Stack>
            {/* Input Values */}

            <Stack
              direction={{ base: "column", md: "row" }}
              spacing={4}
              mb={10}
            >
              <Box flex="2" bg={"gray.100"} borderRadius={8} p={3}>
                <Text fontWeight="semibold" textAlign={"center"} mb={2}>
                  Air Flow
                </Text>
                <Stack direction="row" spacing={2}>
                  <UnitSelect
                    defaultValue={getDefaultForField("units", "airFlow")}
                    label="Unit"
                    name="airFlow"
                    collection={airFlowUnits}
                    value={units.airFlow}
                    onChange={(v) => setUnits((u) => ({ ...u, airFlow: v }))}
                    placeholder="Select air flow"
                  />
                  <Box flex={1}>
                    <Text fontWeight={"semibold"} mb={2}>
                      value
                    </Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      No Default Value
                    </Text>
                    <Input
                      flex={1}
                      name="airFlow"
                      type="number"
                      value={input.airFlow}
                      onChange={handleInputChange}
                      placeholder="e.g. 35000"
                    />
                  </Box>
                </Stack>
              </Box>
              <Box flex="2" bg={"gray.100"} borderRadius={8} p={3}>
                <Text fontWeight="semibold" textAlign={"center"} mb={2}>
                  Static Pressure
                </Text>
                <Stack direction="row" spacing={2}>
                  <UnitSelect
                    label="Unit"
                    defaultValue={getDefaultForField("units", "pressure")}
                    name="pressure"
                    collection={pressureUnits}
                    value={units.pressure}
                    onChange={(v) => setUnits((u) => ({ ...u, pressure: v }))}
                    placeholder="Select pressure"
                  />
                  <Box flex={1}>
                    <Text fontWeight={"semibold"} mb={2}>
                      Value
                    </Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      No Default Value
                    </Text>
                    <Input
                      flex={1}
                      name="staticPressure"
                      type="number"
                      value={input.staticPressure}
                      onChange={handleInputChange}
                      placeholder="e.g. 500"
                    />
                  </Box>
                </Stack>
              </Box>
            </Stack>
            <Stack direction={{ base: "column", md: "row" }} spacing={4}>
              <Box flex="2" bg={"gray.100"} borderRadius={8} p={3}>
                <Text fontWeight="semibold" mb={2} textAlign={"center"}>
                  Fan Input Power
                </Text>
                <Stack direction="row" spacing={2}>
                  <UnitSelect
                    defaultValue={getDefaultForField("units", "power")}
                    label="Unit"
                    name="power"
                    collection={powerUnits}
                    value={units.power}
                    onChange={(v) => setUnits((u) => ({ ...u, power: v }))}
                    placeholder="Select power"
                  />
                  <Box flex={1}>
                    <Text fontWeight={"semibold"} mb={2}>
                      Number of Phases
                    </Text>

                    <UnitSelect
                      defaultValue={getDefaultForField("input", "NoPhases")}
                      name="NoPhases"
                      collection={NoPhases}
                      value={input.NoPhases}
                      onChange={(v) => setInput((u) => ({ ...u, NoPhases: v }))}
                      placeholder="Select Fan Type"
                    />
                  </Box>
                </Stack>
              </Box>
              <Box flex={2} bg={"gray.100"} borderRadius={8} p={3}>
                <Text fontWeight="semibold" mb={2} textAlign={"center"}>
                  Factors
                </Text>
                <Stack direction="row" spacing={2}>
                  <Box flex="1">
                    <Text fontWeight="semibold" mb={2}>
                      Static Pressure Variance (%)
                    </Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Default: {getDefaultForField("input", "SPF")}
                    </Text>
                    <Input
                      name="SPF"
                      type="number"
                      value={input.SPF}
                      onChange={handleInputChange}
                      placeholder="e.g. 5"
                    />
                  </Box>
                  <Box flex="1">
                    <Text fontWeight="semibold" mb={2}>
                      S.P.F (%)
                    </Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Default: {getDefaultForField("input", "Safety")}
                    </Text>
                    <Input
                      name="Safety"
                      type="number"
                      value={input.Safety}
                      onChange={handleInputChange}
                      placeholder="e.g. 5"
                    />
                  </Box>
                </Stack>
              </Box>
            </Stack>
            <Stack direction={{ base: "column", md: "row" }} spacing={4}>
              <Box flex="1"></Box>
              <Box flex="1"></Box>
            </Stack>
            {message && (
              <Box
                bg={
                  message.type === "error"
                    ? "red.100"
                    : message.type === "warning"
                    ? "yellow.100"
                    : "green.100"
                }
                borderRadius="md"
                p={3}
                textAlign="center"
                color={
                  message.type === "error"
                    ? "red.700"
                    : message.type === "warning"
                    ? "yellow.800"
                    : "green.700"
                }
                fontWeight="medium"
              >
                {message.text}
              </Box>
            )}
            <Stack
              direction={"row"}
              justifyContent={"center"}
              alignItems={"center"}
            >
              <Button
                w={650}
                colorScheme="teal"
                type="submit"
                mt={2}
                size="lg"
                isLoading={loading}
              >
                Process Data
              </Button>
            </Stack>
          </Stack>
        </form>
      </Box>

      {result && (
        <Box w="100%" px={{ base: 2, md: 6 }} mt={8}>
          <Box
            mx="auto"
            maxW="1200px"
            bg="white"
            boxShadow="md"
            borderWidth="1px"
            borderRadius="lg"
            p={5}
          >
            <Heading size="md" mb={3}>
              Results
            </Heading>

            {/* Message */}

            {/* If API returned tabular arrays (like samples), try to render them */}
            {result.data &&
              Array.isArray(result.data) &&
              result.data.map((item, idx) => {
                // pick scalar summary fields
                const summaryFields = {
                  FanModel: item.FanModel,
                  Id: item.Id,
                  RPM: item.RPM,
                  desigDensity: item.desigDensity,
                  InputDensity: item.InputDensity,
                };
                console.log(summaryFields.InputDensity);

                // blades and impeller human readable
                const blades = item.Blades
                  ? `${item.Blades.symbol || ""}${
                      item.Blades.material ? ` (${item.Blades.material})` : ""
                    } - ${item.Blades.noBlades || ""} blades @ ${
                      item.Blades.angle || ""
                    }°`
                  : null;
                const imp = item.Impeller
                  ? `${item.Impeller.conf || ""} (inner ${
                      item.Impeller.innerDia || ""
                    } mm)`
                  : null;

                // matched motor info
                const motor = item.matchedMotor;
                let motorEffAvg = null;
                if (motor) {
                  if (Array.isArray(motor.effCurve) && motor.effCurve.length) {
                    motorEffAvg =
                      motor.effCurve.reduce((a, b) => a + b, 0) /
                      motor.effCurve.length;
                  }
                }

                // array series keys are available (table rendering currently disabled)

                return (
                  <Box key={idx} mt={4}>
                    <Text fontWeight="semibold" mb={2}>
                      {summaryFields.FanModel || `Fan ${idx + 1}`} (Id:{" "}
                      {summaryFields.Id})
                    </Text>

                    <Stack
                      direction={{ base: "column", md: "row" }}
                      spacing={4}
                      mb={3}
                    >
                      <Box>
                        <Text fontSize="sm">
                          <b>RPM:</b> {formatValue(summaryFields.RPM)}
                        </Text>
                        <Text fontSize="sm">
                          <b>Design Density:</b>{" "}
                          {formatValue(summaryFields.desigDensity)}
                        </Text>
                        <Text fontSize="sm">
                          <b>Input Density:</b> {summaryFields.InputDensity}
                        </Text>
                      </Box>
                      <Box>
                        {blades && (
                          <Text fontSize="sm">
                            <b>Blades:</b> {blades}
                          </Text>
                        )}
                        {imp && (
                          <Text fontSize="sm">
                            <b>Impeller:</b> {imp}
                          </Text>
                        )}
                        {motor && (
                          <Box mt={2}>
                            <Text fontSize="sm">
                              <b>Motor Model:</b> {motor.model || "-"}
                            </Text>
                            <Text fontSize="sm">
                              <b>Power (kW):</b> {formatValue(motor.powerKW)}
                            </Text>
                            <Text fontSize="sm">
                              <b>No Poles:</b> {formatValue(motor.NoPoles)}
                            </Text>
                            <Text fontSize="sm">
                              <b>Volt / Phase / Freq:</b>{" "}
                              {motor.Phase === 1 ? "220" : "380" || "-"} /{" "}
                              {motor.Phase || "-"} / 50 Hz
                            </Text>
                            <Text fontSize="sm">
                              <b>Motor Efficiency:</b>{" "}
                              {motorEffAvg
                                ? `${(motorEffAvg * 100).toFixed(2)}%`
                                : "-"}
                            </Text>
                            <Text fontSize="sm">
                              <b>InsulClass:</b> {motor.insClass || "-"}
                            </Text>
                          </Box>
                        )}
                      </Box>
                      <Box>
                        {item.predictions && (
                          <Box>
                            <Text fontSize="sm" fontWeight="semibold">
                              Predictions
                            </Text>
                            <Box mt={1}>
                              <Text fontSize="sm">
                                <b>Static Pressure:</b>{" "}
                                {item.predictions.StaticPressurePred
                                  ? `${item.predictions.StaticPressurePred.toFixed(
                                      2
                                    )}`
                                  : ""}
                              </Text>
                              <Text fontSize="sm">
                                <b>Fan Input Power:</b>{" "}
                                {item.predictions.FanInputPowerPred.toFixed(2)}{" "}
                                {units.power ||
                                  getDefaultForField("units", "power")}
                              </Text>
                              <Text fontSize="sm">
                                <b>Velocity Pressure:</b>{" "}
                                {item.predictions.VelocityPressurePred
                                  ? `${item.predictions.VelocityPressurePred.toFixed(
                                      2
                                    )}`
                                  : ""}
                              </Text>
                              <Text fontSize="sm">
                                <b>Static Efficiency:</b>{" "}
                                {item.predictions.FanStaticEfficiencyPred
                                  ? `${(
                                      item.predictions.FanStaticEfficiencyPred *
                                      100
                                    ).toFixed(2)}%`
                                  : ""}
                              </Text>

                              <Text fontSize="sm">
                                <b>Total Efficiency:</b>{" "}
                                {item.predictions.FanTotalEfficiencyPred
                                  ? `${(
                                      item.predictions.FanTotalEfficiencyPred *
                                      100
                                    ).toFixed(2)}%`
                                  : ""}
                              </Text>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Stack>

                    {/* {seriesKeys.length > 0 ? (
                      <ChakraBox overflowX="auto">
                        <Table.Root>
                          <Table.Header>
                            <Table.Row>
                              <Table.ColumnHeader>#</Table.ColumnHeader>
                              {seriesKeys.map((k) => (
                                <Table.ColumnHeader key={k}>
                                  {k}
                                </Table.ColumnHeader>
                              ))}
                            </Table.Row>
                          </Table.Header>

                          <Table.Body>
                            {Array.from({ length: maxLen }).map((_, rowIdx) => (
                              <Table.Row key={rowIdx}>
                                <Table.Cell>{rowIdx + 1}</Table.Cell>
                                {seriesKeys.map((k) => (
                                  <Table.Cell key={k}>
                                    {formatValue(item[k][rowIdx])}
                                  </Table.Cell>
                                ))}
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Root>
                      </ChakraBox>
                    ) : (
                      <Text>No series data available</Text>
                    )} */}
                  </Box>
                );
              })}

            {/* <Box mt={4} p={3} bg="gray.100" borderRadius="md">
              <Text fontSize="sm" mb={1} color="gray.700">
                <b>Payload Sent:</b>
              </Text>
              <Code
                p={2}
                display="block"
                whiteSpace="pre"
                overflowX="auto"
                fontSize="xs"
              >
                {JSON.stringify(result.payload, null, 2)}
              </Code>
            </Box> */}
          </Box>
        </Box>
      )}
    </>
  );
}
