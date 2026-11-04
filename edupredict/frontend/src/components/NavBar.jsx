import { Container, Nav, Navbar, Button } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function NavBar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <Navbar expand="md" className="topbar" variant="dark">
      <Container>
        <Navbar.Brand as={NavLink} to="/" className="brand">EduPredict</Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          {user ? (
            <>
              <Nav className="me-auto">
                {user.role === "student" ? (
                  <>
                    <Nav.Link as={NavLink} to="/dashboard">My progress</Nav.Link>
                    <Nav.Link as={NavLink} to="/assess">New assessment</Nav.Link>
                  </>
                ) : (
                  <Nav.Link as={NavLink} to="/teacher">Students</Nav.Link>
                )}
                <Nav.Link as={NavLink} to="/model">About the model</Nav.Link>
              </Nav>
              <span className="text-white-50 me-3 small">{user.name} ({user.role})</span>
              <Button size="sm" variant="outline-light" onClick={() => { logout(); nav("/login"); }}>
                Sign out
              </Button>
            </>
          ) : (
            <Nav className="ms-auto">
              <Nav.Link as={NavLink} to="/login">Sign in</Nav.Link>
              <Nav.Link as={NavLink} to="/register">Create account</Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
