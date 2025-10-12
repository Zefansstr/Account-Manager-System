"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Operator = {
  id: string;
  username: string;
  password?: string;
  full_name: string;
  operator_role_id: string;
  role_name?: string;
  status: string;
  last_login?: string;
  created_at: string;
};

type OperatorRole = {
  id: string;
  role_code: string;
  role_name: string;
  status: string;
};

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [roles, setRoles] = useState<OperatorRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    operator_role_id: "",
    status: "active",
  });

  const fetchOperators = async () => {
    try {
      const res = await fetch("/api/operators");
      const json = await res.json();
      setOperators(json.data || []);
    } catch (error) {
      console.error("Error fetching operators:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/operator-roles");
      const json = await res.json();
      setRoles((json.data || []).filter((r: OperatorRole) => r.status === "active"));
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  useEffect(() => {
    fetchOperators();
    fetchRoles();
  }, []);

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      full_name: "",
      operator_role_id: roles.length > 0 ? roles[0].id : "",
      status: "active",
    });
  };

  const handleAdd = async () => {
    // Reset messages
    setErrorMessage("");
    setSuccessMessage("");

    // Validate form
    if (!formData.username.trim()) {
      setErrorMessage("Username tidak boleh kosong");
      return;
    }
    if (!formData.password.trim()) {
      setErrorMessage("Password tidak boleh kosong");
      return;
    }
    if (!formData.full_name.trim()) {
      setErrorMessage("Full Name tidak boleh kosong");
      return;
    }
    if (!formData.operator_role_id) {
      setErrorMessage("Silakan pilih Role");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok) {
        await fetchOperators();
        setIsAddOpen(false);
        resetForm();
        setSuccessMessage("Operator berhasil ditambahkan!");
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(result.error || "Gagal menambahkan operator");
      }
    } catch (error: any) {
      console.error("Error adding operator:", error);
      setErrorMessage("Terjadi kesalahan: " + (error.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedOperator) return;

    try {
      const res = await fetch(`/api/operators/${selectedOperator.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchOperators();
        setIsEditOpen(false);
        setSelectedOperator(null);
        resetForm();
      }
    } catch (error) {
      console.error("Error editing operator:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedOperator) return;

    try {
      const res = await fetch(`/api/operators/${selectedOperator.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchOperators();
        setIsDeleteOpen(false);
        setSelectedOperator(null);
      }
    } catch (error) {
      console.error("Error deleting operator:", error);
    }
  };

  const openEditDialog = (operator: Operator) => {
    setSelectedOperator(operator);
    setFormData({
      username: operator.username,
      password: "",
      full_name: operator.full_name,
      operator_role_id: operator.operator_role_id,
      status: operator.status,
    });
    setIsEditOpen(true);
  };

  const toggleOperatorStatus = async (operator: Operator) => {
    try {
      const newStatus = operator.status === "active" ? "inactive" : "active";
      const res = await fetch(`/api/operators/${operator.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: operator.full_name,
          operator_role_id: operator.operator_role_id,
          status: newStatus,
        }),
      });

      if (res.ok) {
        await fetchOperators();
      }
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading operators...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Operators</h2>
          <p className="text-sm text-muted-foreground">
            Manage system operators and assign roles
          </p>
        </div>
        <Button onClick={() => {
          resetForm();
          setErrorMessage("");
          setSuccessMessage("");
          setIsAddOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Operator
        </Button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg border border-green-500 bg-green-50 dark:bg-green-950/20 px-4 py-3">
          <p className="text-sm text-green-700 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="w-[20%] px-4 py-3 text-left text-sm font-semibold text-foreground">Full Name</th>
                <th className="w-[20%] px-4 py-3 text-left text-sm font-semibold text-foreground">Username</th>
                <th className="w-[20%] px-4 py-3 text-left text-sm font-semibold text-foreground">Role</th>
                <th className="w-[15%] px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="w-[25%] px-4 py-3 text-center text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {operators.map((operator, index) => (
                <tr
                  key={operator.id}
                  className={`border-b border-border transition-colors hover:bg-secondary/30 ${
                    index % 2 === 0 ? "bg-card" : "bg-secondary/10"
                  }`}
                >
                  <td className="px-4 py-3 text-sm text-foreground font-medium">{operator.full_name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="font-medium text-primary">{operator.username}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      {operator.role_name}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge
                      variant={operator.status === "active" ? "default" : "secondary"}
                      className={
                        operator.status === "active"
                          ? "bg-primary/20 text-primary border border-primary"
                          : "bg-secondary text-muted-foreground"
                      }
                    >
                      {operator.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleOperatorStatus(operator)}
                        className={
                          operator.status === "active"
                            ? "hover:bg-destructive/10 hover:text-destructive"
                            : "hover:bg-primary/10 hover:text-primary"
                        }
                        title={operator.status === "active" ? "Disable" : "Enable"}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(operator)}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOperator(operator);
                          setIsDeleteOpen(true);
                        }}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Operator Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add New Operator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-lg border border-red-500 bg-red-50 dark:bg-red-950/20 px-4 py-3">
                <p className="text-sm text-red-700 dark:text-red-400">{errorMessage}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="add-username">Username</Label>
              <Input
                id="add-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">Password</Label>
              <Input
                id="add-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-fullname">Full Name</Label>
              <Input
                id="add-fullname"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter full name"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-role">Role</Label>
              <select
                id="add-role"
                value={formData.operator_role_id}
                onChange={(e) => setFormData({ ...formData, operator_role_id: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {roles.length === 0 ? (
                  <option value="">No roles available</option>
                ) : (
                  roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.role_name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-status">Status</Label>
              <select
                id="add-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleAdd} 
              className="bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menambahkan..." : "Add Operator"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Operator Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Operator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Password (leave blank to keep current)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-fullname">Full Name</Label>
              <Input
                id="edit-fullname"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <select
                id="edit-role"
                value={formData.operator_role_id}
                onChange={(e) => setFormData({ ...formData, operator_role_id: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {roles.length === 0 ? (
                  <option value="">No roles available</option>
                ) : (
                  roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.role_name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} className="bg-primary hover:bg-primary/90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete operator <strong className="text-foreground">{selectedOperator?.username}</strong>? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

