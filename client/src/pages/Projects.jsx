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
  Dialog,
  Input,
  useDisclosure,
  createListCollection,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const { open, onOpen, onClose } = useDisclosure();
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const resp = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/projects`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!resp.ok) throw new Error(`Failed to load projects: ${resp.status}`);
      const data = await resp.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      setError("Project name is required");
      return;
    }
    setCreatingProject(true);
    try {
      const token = localStorage.getItem("token");
      const resp = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/projects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newProjectName.trim(),
            description: newProjectDesc.trim(),
          }),
        }
      );
      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || "Failed to create project");
      }
      setNewProjectName("");
      setNewProjectDesc("");
      onClose();
      await fetchProjects();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;
    setDeleting(projectId);
    try {
      const token = localStorage.getItem("token");
      const resp = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/projects/${projectId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!resp.ok) throw new Error("Failed to delete project");
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to delete project");
    } finally {
      setDeleting(null);
    }
  };

  const statusColor = (status) => (status === "ACTIVE" ? "green" : "gray");

  const isSupervisor = user?.role === "admin";
  const isEngineer = user?.role === "engineer";

  return (
    <Box p={6} bg="white" minH="100vh" mt={20}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="lg">
          Projects
        </Heading>
        <Button colorScheme="blue" onClick={onOpen}>
          + New Project
        </Button>
      </Flex>

      {error && (
        <Alert.Root status="error" mb={4}>
          <Alert.Indicator />
          <Alert.Title>{error}</Alert.Title>
        </Alert.Root>
      )}

      {loading ? (
        <Flex justify="center" align="center" h="300px">
          <Spinner size="lg" />
        </Flex>
      ) : projects.length === 0 ? (
        <Alert.Root status="info">
          <Alert.Indicator />
          <Alert.Title>
            No projects found. Create one to get started!
          </Alert.Title>
        </Alert.Root>
      ) : (
        <Box overflowX="auto">
          <Table.Root variant="line" striped>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Project Name</Table.ColumnHeader>
                <Table.ColumnHeader>Description</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Created By</Table.ColumnHeader>
                <Table.ColumnHeader>Motors</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {projects.map((project) => (
                <Table.Row key={project.id}>
                  <Table.Cell fontWeight="bold">{project.name}</Table.Cell>
                  <Table.Cell>{project.description || "—"}</Table.Cell>
                  <Table.Cell>
                    <Badge colorScheme={statusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {project.creator
                      ? `${project.creator.firstName} ${project.creator.lastName}`
                      : "N/A"}
                  </Table.Cell>
                  <Table.Cell>{project.motors?.length || 0}</Table.Cell>
                  <Table.Cell>
                    <Stack direction="row" spacing={2}>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() =>
                          navigate(`/projects/${project.id}`, {
                            state: { project },
                          })
                        }
                      >
                        View
                      </Button>
                      {isSupervisor && (
                        <>
                          <Button
                            size="sm"
                            colorScheme="yellow"
                            onClick={() =>
                              navigate(`/projects/${project.id}/edit`, {
                                state: { project },
                              })
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="red"
                            isLoading={deleting === project.id}
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </Stack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {/* Create Project Modal */}
      <Dialog.Root
        open={open}
        onOpenChange={(details) => (details.open ? onOpen() : onClose())}
      >
        <Dialog.Backdrop />
        <Dialog.Content>
          <Dialog.Header>Create New Project</Dialog.Header>
          <Dialog.CloseTrigger />
          <Dialog.Body>
            <Stack spacing={4}>
              <Input
                placeholder="Project Name *"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
              <Input
                placeholder="Description"
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
              />
            </Stack>
          </Dialog.Body>
          <Dialog.Footer>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              loading={creatingProject}
              onClick={handleCreateProject}
            >
              Create
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
}
