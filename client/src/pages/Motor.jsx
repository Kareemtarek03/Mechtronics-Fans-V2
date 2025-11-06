import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  Spinner,
  Table,
  Alert,
  Stack,
  Dialog,
  Portal,
  CloseButton,
  Input,
} from "@chakra-ui/react";

export default function MotorPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [motors, setMotors] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMotor, setSelectedMotor] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [exportMessage, setExportMessage] = useState(null);
  const fileInputRef = useRef(null);
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/motor-data/`
      );
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`API error: ${resp.status} ${text}`);
      }
      const data = await resp.json();
      // accept either { data: [...] } or an array
      const list = Array.isArray(data) ? data : data.data || [];
      setMotors(list);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load motors");
      setMotors([]);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (motorId) => {
    try {
      setDeletingIds((s) => [...s, motorId]);
      const resp = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/motor-data/${motorId}`,
        { method: "DELETE" }
      );
      if (!resp.ok) {
        const j = await resp.json().catch(() => null);
        throw new Error(j?.error || resp.statusText || "Delete failed");
      }
      await fetchData();
    } catch (e) {
      console.error(e);
      setError(e.message || "Delete failed");
    } finally {
      setDeletingIds((s) => s.filter((x) => x !== motorId));
      setOpenDialog(false);
      setSelectedMotor(null);
    }
  };

  const formatValue = (v) => {
    if (v === null || v === undefined) return "-";
    if (Array.isArray(v)) return v.join(", ");
    if (typeof v === "object") return JSON.stringify(v);
    if (typeof v === "number")
      return v.toLocaleString(undefined, { maximumFractionDigits: 6 });
    return String(v);
  };

  // Format column names to be more human-friendly (similar to FanData.jsx)
  const formatColumnName = (k) => {
    if (!k && k !== 0) return "";
    // known mappings (keep consistent with FanData naming where applicable)
    const map = {
      airFlow: "Air Flow",
      totPressure: "Total Pressure",
      staticPressure: "Static Pressure",
      velPressure: "Velocity Pressure",
      fanInputPow: "Fan Input Power",
      Id: "Id",
      id: "Id",
      model: "Model",
      RPM: "RPM",
    };

    if (map[k]) return map[k];

    // If key already contains spaces or dashes, just Title Case the words
    const normalize = String(k)
      // convert snake_case to words
      .replace(/[_-]+/g, " ")
      // split camelCase boundaries
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .trim();

    // Title case each word
    return normalize
      .split(" ")
      .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");
  };

  // Build columns from keys of items, with custom mappings and special handling
  // for effCurve (expand into frequency-labelled columns)
  const columns = React.useMemo(() => {
    const cols = new Set();
    motors.forEach((m) => Object.keys(m || {}).forEach((k) => cols.add(k)));
    const keys = Array.from(cols);

    const normalize = (s) =>
      String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    // user-provided friendly mappings (normalized key -> label)
    const friendly = {
      material: "Material",
      model: "Model",
      powerkw: "Power KW",
      speedrpm: "Speed RPM",
      nopoles: "No Poles",
      rated: "Rated",
      dol: "DOL",
      stardelta: "Star Delta",
      powerfactor: "Power Factor",
      phase: "Phase",
      framesize: "Frame Size",
      shaftdia: "Shaft Diameter",
      shaftdiam: "Shaft Diameter",
      shaftlength: "Shaft Length",
      shaftfeather: "Shaft Feather",
      ie: "IE",
      frontbear: "Front Bearing",
      rearbear: "Rear Bearing",
      noiselvl: "Noise Lvl",
      weightkg: "Weight Kg",
      effcurve: "Eff Curve",
      nocapacitors: "No Capacitors",
      nophases: "No Phases",
      insclass: "Insulation Class",
      powerhorse: "Power (HP)",
      netpower: "Net Power",
    };

    // keys which should be expanded when they contain nested objects
    const nestedExpand = new Set(["rated", "dol", "stardelta"]);

    const formatNestedName = (nk) => {
      if (!nk) return "";
      const m = {
        tourqueNm: "Torque (Nm)",
        tourque: "Torque",
        currentInput: "Current Input",
        current: "Current",
        MaMn: "MaMn",
        laln: "LaIn",
        // fallbacks will Title Case below
      };
      if (m[nk]) return m[nk];
      // title case fallback
      return String(nk)
        .replace(/[_-]+/g, " ")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .split(" ")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(" ");
    };

    // special labels for effCurve indices
    const effFreqLabels = ["50 Hz", "37.5 Hz", "25 Hz"];

    // Build final column descriptor list.
    // - For effCurve: expand into frequency-labelled columns
    // - For nested objects (rated, dol, stardelta): expand their properties into sub-columns
    const out = [];
    keys.forEach((k) => {
      const norm = normalize(k);

      if (norm === "effcurve") {
        // find max length
        const max = Math.max(
          ...motors.map((m) => (Array.isArray(m[k]) ? m[k].length : 0)),
          0
        );
        for (let i = 0; i < Math.max(1, max); i++) {
          const freqLabel = effFreqLabels[i] || `${i + 1}`;
          out.push({
            key: `${k}[${i}]`,
            label: `Efficiency - ${freqLabel}`,
          });
        }
        return;
      }

      if (nestedExpand.has(norm)) {
        // gather nested keys across all motors
        const nestedKeys = Array.from(
          new Set(
            motors.flatMap((m) => {
              const obj =
                m && m[k] && typeof m[k] === "object" && !Array.isArray(m[k])
                  ? m[k]
                  : {};
              return Object.keys(obj || {});
            })
          )
        );

        if (nestedKeys.length === 0) {
          // no nested properties found; create a single column for the object
          out.push({ key: k, label: friendly[norm] || formatColumnName(k) });
        } else {
          nestedKeys.forEach((nk) => {
            out.push({
              key: `${k}.${nk}`,
              label: `${friendly[norm]}  ${formatNestedName(nk)}`,
            });
          });
        }

        return;
      }

      const label = friendly[norm] || null;
      out.push({ key: k, label: label || formatColumnName(k) });
    });

    return out;
  }, [motors]);

  const downloadMotorTemplate = async () => {
    // expects pre-made file at /templates/MotorData-template.xlsx in the client public folder
    try {
      const urlPath = `${
        process.env.PUBLIC_URL || ""
      }/templates/Motor-Data-Template.xlsx`;
      const resp = await fetch(urlPath);
      if (!resp.ok) throw new Error(`Template not found: ${resp.status}`);
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Motor-Data-Template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setExportMessage(err.message || "Failed to download template");
    }
  };

  return (
    <Box p={4} bg={"#0f172a"} color={"white"} mt={20} pt={12}>
      <Heading mb={4} fontSize={"4xl"} textAlign={"center"}>
        Motors
      </Heading>

      <Stack direction={"row"} justify="space-between">
        <Box mb={4} display="flex" gap={2} alignItems="center">
          <Button
            size="sm"
            bg="#3b82f6"
            _hover={{
              bg: "#2563eb",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
            }}
            onClick={fetchData}
            isDisabled={loading}
          >
            Refresh
          </Button>
          {loading && <Spinner size="sm" />}
        </Box>
        <Box mb={4} display="flex" gap={2} alignItems="center">
          <Box mb={4} display="flex" gap={2} alignItems="center">
            <Button
              size="sm"
              bg="#3b82f6"
              _hover={{
                bg: "#2563eb",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              }}
              onClick={() =>
                fileInputRef.current && fileInputRef.current.click()
              }
              isDisabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload Motor Data"}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              accept=".xlsx,.xls,.csv"
              onChange={async (e) => {
                const f = e.target.files && e.target.files[0];
                e.target.value = ""; // reset so same file can be re-picked later
                if (!f) return;
                try {
                  setUploading(true);
                  setUploadMessage(null);

                  // read file as data URL and strip prefix
                  const dataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(f);
                  });
                  const base64 = String(dataUrl).split(",")[1] || "";

                  const resp = await fetch(
                    `${process.env.REACT_APP_API_BASE_URL}/api/motor-data/upload`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        fileBase64: base64,
                        filename: f.name,
                      }),
                    }
                  );
                  const json = await resp.json().catch(() => ({}));
                  if (!resp.ok) {
                    throw new Error(
                      json?.error ||
                        json?.details ||
                        resp.statusText ||
                        "Upload failed"
                    );
                  }
                  setUploadMessage("Import successful");
                  // refresh list
                  console.log("Fetching data after upload...");
                  await fetchData();
                  console.log("Data fetched after upload.");
                } catch (err) {
                  console.error(err);
                  setUploadMessage(err.message || "Upload failed");
                } finally {
                  console.log("Setting uploading to false");
                  setUploading(false);
                }
              }}
            />
          </Box>
          <Box mb={4} display="flex" gap={2} alignItems="center">
            <Button
              size="sm"
              bg="#3b82f6"
              isLoading={downloading}
              _hover={{
                bg: "#2563eb",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              }}
              onClick={async () => {
                try {
                  setDownloading(true);
                  setExportMessage(null);
                  const resp = await fetch(
                    `${process.env.REACT_APP_API_BASE_URL}/api/motor-data/export`
                  );
                  if (!resp.ok) {
                    const txt = await resp.text().catch(() => null);
                    throw new Error(txt || resp.statusText || "Export failed");
                  }

                  // try to determine filename from content-disposition
                  const cd = resp.headers.get("content-disposition") || "";
                  let filename = "MotorData-export.xlsx";
                  const m = cd.match(
                    /filename\*=UTF-8''(.+)$|filename="?([^";]+)"?/i
                  );
                  if (m) {
                    filename = decodeURIComponent(
                      (m[1] || m[2] || filename).trim()
                    );
                  }

                  const blob = await resp.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);
                  setExportMessage("Export downloaded");
                } catch (err) {
                  console.error(err);
                  setExportMessage(err.message || "Export failed");
                } finally {
                  setDownloading(false);
                }
              }}
            >
              Export Motor Data
            </Button>
            <Button
              size="sm"
              bg="#10b981"
              _hover={{ bg: "#059669" }}
              onClick={downloadMotorTemplate}
            >
              Download Template
            </Button>
          </Box>
        </Box>
      </Stack>

      {error && (
        <Alert.Root status="error" mb={4}>
          <Alert.Indicator />
          <Alert.Title>Error</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      )}

      {uploadMessage && (
        <Alert.Root
          status={/successful/i.test(uploadMessage) ? "success" : "error"}
          mb={4}
        >
          <Alert.Indicator />
          <Alert.Title>
            {/successful/i.test(uploadMessage) ? "Success" : "Error"}
          </Alert.Title>
          <Alert.Description>{uploadMessage}</Alert.Description>
        </Alert.Root>
      )}

      {!loading && motors.length === 0 && !error && (
        <Text>No motors returned from API.</Text>
      )}
      <Text mb={4}>{motors.length} Motors Found</Text>
      {motors.length > 0 && (
        <Box
          overflowX="auto"
          borderWidth="1px"
          borderRadius="md"
          borderColor="#334155"
          bg={"#1e293b"}
        >
          <Table.Root bg={"#1e293b"} w={"max-content"}>
            <Table.Header bg={"#1e293b"} color={"white"}>
              <Table.Row bg={"#1e293b"} color={"white"}>
                <Table.ColumnHeader color={"white"}>Actions</Table.ColumnHeader>

                {columns.map((col) => (
                  <Table.ColumnHeader color={"white"} key={`h-${col.key}`}>
                    {col.label}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>

            <Table.Body borderColor="#334155">
              {motors.map((m, idx) => {
                const rowBg = idx % 2 === 0 ? "#0f172a" : "#1e293b";

                return (
                  <Table.Row key={`c-${m.id}`} color={"white"} bg={rowBg}>
                    <Table.Cell borderColor="#334155">
                      {(() => {
                        const motorId = m.id ?? m.Id ?? null;
                        if (!motorId) return "-";
                        const isDeleting = deletingIds.includes(motorId);
                        return (
                          <Button
                            size="xs"
                            colorScheme="red"
                            isLoading={isDeleting}
                            onClick={() => {
                              setSelectedMotor(m);
                              setOpenDialog(true);
                            }}
                          >
                            Delete
                          </Button>
                        );
                      })()}
                    </Table.Cell>
                    {columns.map((col) => {
                      // support array-style keys like 'effCurve[0]' and nested object keys like 'Rated.tourqueNm'
                      const arrMatch = String(col.key).match(/^(.*)\[(\d+)\]$/);
                      const dotMatch = String(col.key).match(/^(.*)\.(.+)$/);
                      let val;
                      if (arrMatch) {
                        const base = arrMatch[1];
                        const idx = parseInt(arrMatch[2], 10);
                        const arr = Array.isArray(m[base]) ? m[base] : [];
                        val = arr[idx];
                      } else if (dotMatch) {
                        const base = dotMatch[1];
                        const prop = dotMatch[2];
                        const obj =
                          m &&
                          m[base] &&
                          typeof m[base] === "object" &&
                          !Array.isArray(m[base])
                            ? m[base]
                            : {};
                        val = obj[prop];
                      } else {
                        val = m[col.key];
                      }

                      return (
                        <Table.Cell
                          borderColor="#334155"
                          key={`r-${col.key}-${m.id}`}
                        >
                          {formatValue(val)}
                        </Table.Cell>
                      );
                    })}
                  </Table.Row>
                );
                // ) : (
                //   <></>
                // );
              })}
            </Table.Body>
          </Table.Root>
        </Box>
      )}
      <Dialog.Root open={openDialog}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content bg="#1e293b" color="white">
              <Dialog.Header>
                <Dialog.Title>Delete Motor</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                {selectedMotor ? (
                  <Text>
                    Are you sure you want to delete motor ID{" "}
                    <strong>{selectedMotor.id}</strong>? This action cannot be
                    undone.
                  </Text>
                ) : (
                  <Text>No motor selected.</Text>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button
                    variant="solid"
                    color="black"
                    bg="#ffe"
                    onClick={() => setOpenDialog(false)}
                  >
                    Cancel
                  </Button>
                </Dialog.ActionTrigger>
                <Button
                  colorScheme="red"
                  onClick={() => handleDelete(selectedMotor?.id)}
                  isLoading={deletingIds.includes(selectedMotor?.id)}
                >
                  Delete
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  size="sm"
                  color="white"
                  _hover={{
                    bg: "gray",
                  }}
                  onClick={() => {
                    setOpenDialog(false);
                  }}
                />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
}
