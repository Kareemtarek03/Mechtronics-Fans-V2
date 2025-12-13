import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  Spinner,
  Alert,
  Table,
  Flex,
  Stack,
  Badge,
  Card,
  Dialog,
  Input,
  useDisclosure,
  NativeSelectRoot,
  NativeSelectField,
} from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const [fans, setFans] = useState([]);
  const [motors, setMotors] = useState([]);
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [addingMotor, setAddingMotor] = useState(false);
  const { open, onOpen, onClose } = useDisclosure();
  const [selectedFanId, setSelectedFanId] = useState("");
  const [selectedMotorId, setSelectedMotorId] = useState("");

  useEffect(() => {
    const userRole = localStorage.getItem("userRole") || "";
    // console.log("User Role:", userRole);
    setUser(userRole);
    fetchProjectDetail();
    fetchFansAndMotors();
  }, [projectId]);

  const fetchProjectDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const resp = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/projects/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!resp.ok) throw new Error("Failed to load project");
      const data = await resp.json();
      setProject(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const fetchFansAndMotors = async () => {
    try {
      const token = localStorage.getItem("token");
      const [fanResp, motorResp] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_BASE_URL}/api/fan-data/fan-data`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.REACT_APP_API_BASE_URL}/api/motor-data`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (fanResp.ok) {
        const fanData = await fanResp.json();
        setFans(Array.isArray(fanData) ? fanData : fanData.data || []);
      }
      if (motorResp.ok) {
        const motorData = await motorResp.json();
        setMotors(Array.isArray(motorData) ? motorData : motorData.data || []);
      }
    } catch (err) {
      console.error("Failed to load fans/motors", err);
    }
  };

  const handleAddMotor = async () => {
    if (!selectedFanId || !selectedMotorId) {
      setError("Please select both a fan and a motor");
      return;
    }
    setAddingMotor(true);
    try {
      const token = localStorage.getItem("token");
      const resp = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/projects/${projectId}/motors`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fanId: parseInt(selectedFanId, 10),
            motorId: parseInt(selectedMotorId, 10),
          }),
        }
      );
      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || "Failed to add motor");
      }
      setSelectedFanId("");
      setSelectedMotorId("");
      onClose();
      await fetchProjectDetail();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setAddingMotor(false);
    }
  };

  const handleApprove = async (motorId) => {
    setApproving(motorId);
    try {
      const token = localStorage.getItem("token");
      const resp = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/projects/${projectId}/motors/${motorId}/approve`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!resp.ok) throw new Error("Failed to approve update");
      await fetchProjectDetail();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (motorId) => {
    setRejecting(motorId);
    try {
      const token = localStorage.getItem("token");
      const resp = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/projects/${projectId}/motors/${motorId}/reject`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!resp.ok) throw new Error("Failed to reject update");
      await fetchProjectDetail();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setRejecting(null);
    }
  };

  const handleDelete = async (motorId) => {
    if (!window.confirm("Delete this motor from the project?")) return;
    setDeleting(motorId);
    try {
      const token = localStorage.getItem("token");
      const resp = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/projects/${projectId}/motors/${motorId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!resp.ok) throw new Error("Failed to delete motor");
      await fetchProjectDetail();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const statusColor = (status) => {
    if (status === "APPROVED") return "green";
    if (status === "PENDING") return "yellow";
    return "red";
  };

  const isSupervisor = user === "admin";
  console.log("Is Supervisor:", isSupervisor);

  if (loading) {
    return (
      <Flex justify="center" align="center" h="100vh" bg="white">
        <Spinner size="lg" />
      </Flex>
    );
  }

  if (!project) {
    return (
      <Box p={6} bg="white" minH="100vh">
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Title>Project not found</Alert.Title>
        </Alert.Root>
        <Button mt={4} onClick={() => navigate("/projects")}>
          Back to Projects
        </Button>
      </Box>
    );
  }

  return (
    <Box p={6} bg="white" minH="100vh" mt={16}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="lg">
          {project.name}
        </Heading>
        <Button
          variant="ghost"
          colorScheme="gray"
          onClick={() => navigate("/projects")}
        >
          Back
        </Button>
      </Flex>

      {error && (
        <Alert.Root status="error" mb={4}>
          <Alert.Indicator />
          <Alert.Title>{error}</Alert.Title>
        </Alert.Root>
      )}

      {/* Project Info Card */}
      <Card.Root mb={6}>
        <Card.Header>
          <Heading size="md">Project Details</Heading>
        </Card.Header>
        <Card.Body>
          <Stack spacing={2}>
            <Flex>
              <Text fontWeight="bold" w="200px">
                Description:
              </Text>
              <Text>{project.description || "—"}</Text>
            </Flex>
            <Flex>
              <Text fontWeight="bold" w="200px">
                Status:
              </Text>
              <Badge
                colorScheme={project.status === "ACTIVE" ? "green" : "gray"}
              >
                {project.status}
              </Badge>
            </Flex>
            <Flex>
              <Text fontWeight="bold" w="200px">
                Created By:
              </Text>
              <Text>
                {project.creator
                  ? `${project.creator.firstName} ${project.creator.lastName}`
                  : "N/A"}
              </Text>
            </Flex>
          </Stack>
        </Card.Body>
      </Card.Root>

      {/* Motors Table */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading as="h2" size="md">
          Fans & Motors
        </Heading>
        {/* {isSupervisor && (
          <Button colorScheme="blue" size="sm" onClick={onOpen}>
            + Add Motor
          </Button>
        )} */}
      </Flex>

      {project.motors && project.motors.length === 0 ? (
        <Alert.Root status="info" mb={6}>
          <Alert.Indicator />
          <Alert.Title>No motors added yet.</Alert.Title>
        </Alert.Root>
      ) : (
        <Box overflowX="auto" mb={6}>
          <Table.Root variant="line" striped>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Action</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Fan ID</Table.ColumnHeader>
                <Table.ColumnHeader>Motor ID</Table.ColumnHeader>
                <Table.ColumnHeader>Added By</Table.ColumnHeader>
                <Table.ColumnHeader>Requested At</Table.ColumnHeader>
                {isSupervisor && (
                  <Table.ColumnHeader>Actions</Table.ColumnHeader>
                )}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {project.motors.map((motor) => (
                <Table.Row key={motor.id}>
                  <Table.Cell>
                    <Badge
                      colorScheme={motor.action === "ADD" ? "blue" : "red"}
                    >
                      {motor.action}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorScheme={statusColor(motor.status)}>
                      {motor.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{motor.fanId}</Table.Cell>
                  <Table.Cell>{motor.motorId}</Table.Cell>
                  <Table.Cell>
                    {motor.requestedBy?.firstName || "N/A"}
                  </Table.Cell>
                  <Table.Cell>
                    {new Date(motor.requestedAt).toLocaleDateString()}
                  </Table.Cell>
                  {isSupervisor && (
                    <Table.Cell>
                      <Stack direction="row" spacing={2}>
                        {motor.status === "PENDING" && (
                          <>
                            <Button
                              size="xs"
                              colorScheme="green"
                              loading={approving === motor.id}
                              onClick={() => handleApprove(motor.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="xs"
                              colorScheme="red"
                              loading={rejecting === motor.id}
                              onClick={() => handleReject(motor.id)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {motor.status === "APPROVED" &&
                          motor.action === "ADD" && (
                            <Button
                              size="xs"
                              colorScheme="red"
                              loading={deleting === motor.id}
                              onClick={() => handleDelete(motor.id)}
                            >
                              Delete
                            </Button>
                          )}
                      </Stack>
                    </Table.Cell>
                  )}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {/* Add Motor Modal */}
      <Dialog.Root
        open={open}
        onOpenChange={(details) => (details.open ? onOpen() : onClose())}
      >
        <Dialog.Backdrop />
        <Dialog.Content>
          <Dialog.Header>Add Motor to Project</Dialog.Header>
          <Dialog.CloseTrigger />
          <Dialog.Body>
            <Stack spacing={4}>
              <NativeSelectRoot>
                <NativeSelectField
                  placeholder="Select a Fan"
                  value={selectedFanId}
                  onChange={(e) => setSelectedFanId(e.target.value)}
                >
                  {fans.map((fan) => (
                    <option key={fan.id} value={fan.id}>
                      Fan {fan.id}
                    </option>
                  ))}
                </NativeSelectField>
              </NativeSelectRoot>
              <NativeSelectRoot>
                <NativeSelectField
                  placeholder="Select a Motor"
                  value={selectedMotorId}
                  onChange={(e) => setSelectedMotorId(e.target.value)}
                >
                  {motors.map((motor) => (
                    <option key={motor.id} value={motor.id}>
                      Motor {motor.id}
                    </option>
                  ))}
                </NativeSelectField>
              </NativeSelectRoot>
            </Stack>
          </Dialog.Body>
          <Dialog.Footer>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              loading={addingMotor}
              onClick={handleAddMotor}
            >
              Add
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
}
