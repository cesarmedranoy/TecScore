"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateDisplayNameAction, type ProfileActionState } from "../actions";

const initialState: ProfileActionState = {};

export function DisplayNameForm({ currentName }: { currentName: string }) {
  const [state, action] = useActionState(updateDisplayNameAction, initialState);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Input
          name="displayName"
          defaultValue={currentName}
          required
          minLength={2}
          maxLength={30}
          className="max-w-sm"
        />
        <SaveButton />
      </div>
      {state.error && (
        <p className="text-sm text-danger">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-success">{state.success}</p>
      )}
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : "Guardar"}
    </Button>
  );
}
