import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  Input,
  Spinner,
  Alert,
  Table,
  Stack,
} from "@chakra-ui/react";

export default function FanDataPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fans, setFans] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [importMessage, setImportMessage] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [exportMessage, setExportMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/fan-data/fan-data`
      );
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`API error: ${resp.status} ${text}`);
      }
      const data = await resp.json();
      const list = Array.isArray(data) ? data : data.data || [];
      setFans(list);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load fan data");
      setFans([]);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (v) => {
    if (v === null || v === undefined) return "";
    if (Array.isArray(v))
      return v
        .map((n) =>
          typeof n === "number"
            ? n.toLocaleString(undefined, { maximumFractionDigits: 6 })
            : String(n)
        )
        .join(", ");
    if (typeof v === "object") return JSON.stringify(v);
    if (typeof v === "number")
      return v.toLocaleString(undefined, { maximumFractionDigits: 6 });
    return String(v);
  };
  // Build table: one row per fan. For each series list create columns named "title - index"
  const seriesKeysUnion = Array.from(
    new Set(
      fans.flatMap((item) =>
        Object.keys(item).filter(
          (k) => Array.isArray(item[k]) && item[k].length
        )
      )
    )
  );

  // determine maximum length per series key across all fans
  const seriesKeyMaxLen = seriesKeysUnion.reduce((acc, k) => {
    acc[k] = Math.max(
      ...fans.map((f) => (Array.isArray(f[k]) ? f[k].length : 0)),
      0
    );
    return acc;
  }, {});

  // columns for series elements: e.g., "airFlow - 1", "airFlow - 2", ...
  const seriesColumns = seriesKeysUnion.flatMap((k) =>
    Array.from({ length: seriesKeyMaxLen[k] || 0 }).map((_, i) => {
      if (k == "airFlow") return `Air Flow - ${i + 1}`;
      else if (k == "totPressure") return `Total Pressure - ${i + 1}`;
      else if (k == "staticPressure") return `Static Pressure - ${i + 1}`;
      else if (k == "velPressure") return `Velocity Pressure - ${i + 1}`;
      else if (k == "fanInputPow") return `Fan Input Power - ${i + 1}`;
      else return `${k} - ${i + 1}`;
    })
  );

  // rows: one per fan. If Id missing, make a temporary auto-increment id (1-based index)
  const rows = fans.map((item, fanIdx) => {
    const row = {
      FanModel: item.FanModel || "",
      Id: item.Id != null && item.Id !== "" ? item.Id : fanIdx + 1,
      RPM: item.RPM,
    };

    seriesKeysUnion.forEach((k) => {
      const arr = Array.isArray(item[k]) ? item[k] : [];
      const max = seriesKeyMaxLen[k] || 0;
      for (let i = 0; i < max; i++) {
        row[
          k == "airFlow"
            ? `Air Flow - ${i + 1}`
            : k == "totPressure"
            ? `Total Pressure - ${i + 1}`
            : k == "staticPressure"
            ? `Static Pressure - ${i + 1}`
            : k == "velPressure"
            ? `Velocity Pressure - ${i + 1}`
            : k == "fanInputPow"
            ? `Fan Input Power - ${i + 1}`
            : `${k} - ${i + 1}`
        ] = i < arr.length ? arr[i] : undefined;
      }
    });

    return row;
  });

  // pagination (rows are fans)
  const PAGE_SIZE = 50;
  const [page, setPage] = useState(0);
  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

  const start = page * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, totalRows);
  const pageRows = rows.slice(start, end);

  return (
    <Box p={4} mt={20} bg={"#0f172a"} color={"white"} pt={12}>
      <Heading mb={4} fontSize={"4xl"} textAlign={"center"}>
        Fan Data (combined)
      </Heading>

      <Stack direction={"row"} justifyContent={"space-between"}>
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
          <Button
            size="sm"
            bg="#3b82f6"
            _hover={{
              bg: "#2563eb",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
            }}
            onClick={() =>
              document.getElementById("fandata-file-input")?.click()
            }
            isDisabled={uploading}
          >
            {uploading ? "Importing..." : "Import Fan Data"}
          </Button>
          <Input
            id="fandata-file-input"
            type="file"
            display="none"
            accept=".xlsx,.xls,.csv"
            onChange={async (e) => {
              const f = e.target.files && e.target.files[0];
              e.target.value = "";
              if (!f) return;
              try {
                setUploading(true);
                setImportMessage(null);
                const dataUrl = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result);
                  reader.onerror = reject;
                  reader.readAsDataURL(f);
                });
                const base64 = String(dataUrl).split(",")[1] || "";
                const resp = await fetch(
                  `${process.env.REACT_APP_API_BASE_URL}/api/fan-data/upload`,
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
                if (!resp.ok)
                  throw new Error(
                    json?.error ||
                      json?.details ||
                      resp.statusText ||
                      "Import failed"
                  );
                setImportMessage("Import successful");
                await fetchData();
              } catch (err) {
                console.error(err);
                setImportMessage(err.message || "Import failed");
              } finally {
                setUploading(false);
              }
            }}
          />

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
                  `${process.env.REACT_APP_API_BASE_URL}/api/fan-data/export`
                );
                if (!resp.ok) {
                  const txt = await resp.text().catch(() => null);
                  throw new Error(txt || resp.statusText || "Export failed");
                }
                const cd = resp.headers.get("content-disposition");
                let filename = "FanData-export.xlsx";

                if (cd) {
                  const m = cd.match(
                    /filename\*=UTF-8''(.+)$|filename="?([^";]+)"?/i
                  );
                  if (m) {
                    filename = decodeURIComponent(
                      (m[1] || m[2] || filename).trim()
                    );
                  }
                }

                const blob = await resp.blob();
                if (blob.type.includes("json")) {
                  const err = await blob.text();
                  throw new Error(err);
                }

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
            Export Fan Data
          </Button>
        </Box>
      </Stack>

      {importMessage && (
        <Alert.Root
          status={/successful/i.test(importMessage) ? "success" : "error"}
          mb={4}
        >
          <Alert.Title>
            {/successful/i.test(importMessage) ? "Success" : "Error"}
          </Alert.Title>
          <Alert.Description>{importMessage}</Alert.Description>
        </Alert.Root>
      )}
      {exportMessage && (
        <Alert.Root
          status={/downloaded/i.test(exportMessage) ? "success" : "error"}
          mb={4}
        >
          <Alert.Title>
            {/downloaded/i.test(exportMessage) ? "Success" : "Error"}
          </Alert.Title>
          <Alert.Description>{exportMessage}</Alert.Description>
        </Alert.Root>
      )}

      {error && (
        <Alert.Root status="error" mb={4}>
          <Alert.Title>Error</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      )}

      {!loading && fans.length === 0 && !error && (
        <Text>No fan data returned.</Text>
      )}

      {!loading && fans.length > 0 && (
        <>
          <Text mb={2} fontSize="sm">
            Showing {start + 1} - {end} of {totalRows} fans
          </Text>

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
                  <Table.ColumnHeader color={"white"}>Id</Table.ColumnHeader>
                  <Table.ColumnHeader
                    borderRight={"1px solid #fff"}
                    color={"white"}
                  >
                    RPM
                  </Table.ColumnHeader>
                  {seriesColumns.map((col) => {
                    const end = col.endsWith("10");
                    return (
                      <Table.ColumnHeader
                        borderRight={end ? "1px solid #fff" : "none"}
                        color={"white"}
                        key={col}
                      >
                        {col}
                      </Table.ColumnHeader>
                    );
                  })}
                </Table.Row>
              </Table.Header>

              <Table.Body borderColor="#334155">
                {pageRows.map((r, idx) => {
                  // determine alternating background: even rows -> #0f172a, odd rows -> #1e293b
                  const rowBg = idx % 2 === 0 ? "#0f172a" : "#1e293b";

                  const valid =
                    r[seriesColumns[0]] != 0 &&
                    seriesColumns.length > 5 &&
                    r[seriesColumns[1]] != "" &&
                    r[seriesColumns[1]] != null &&
                    r[seriesColumns[1]] != undefined &&
                    r[seriesColumns[1]] != "-" &&
                    r[seriesColumns[1]] != 0;

                  if (!valid) return <></>;
                  return (
                    <Table.Row
                      bg={rowBg}
                      color={"white"}
                      key={`${r.Id}-${idx}`}
                    >
                      <Table.Cell borderColor="#334155">
                        {formatValue(r.Id)}
                      </Table.Cell>
                      <Table.Cell
                        borderRight={"1px solid #fff"}
                        borderBottomColor="#334155"
                      >
                        {formatValue(r.RPM)}
                      </Table.Cell>
                      {seriesColumns.map((col) => {
                        const end = col.endsWith("10");
                        return (
                          <Table.Cell
                            borderRight={end ? "1px solid #fff" : "none"}
                            borderBottomColor="#334155"
                            key={col}
                          >
                            {formatValue(r[col])}
                          </Table.Cell>
                        );
                      })}
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </Box>

          <Box mt={3} display="flex" alignItems="center" gap={3}>
            <Button
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              isDisabled={page === 0}
              bg={"#0F2063"}
            >
              Prev
            </Button>
            <Text fontSize="sm">
              Page {page + 1} of {totalPages}
            </Text>
            <Button
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              isDisabled={page >= totalPages - 1}
              bg={"#0F2063"}
            >
              Next
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
