"use client";

import { Loader2, Save } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveProfile, saveProfileFile } from "@/app/admin/actions";
import { PROFILE_FIELDS, rowToValues, validateFields } from "@/lib/admin/entities";
import { removeFileByUrl } from "@/lib/admin/upload";
import type { Profile } from "@/lib/types";
import { FileUpload } from "./fields";
import { FormFields } from "./form-fields";

export function ProfileForm({ profile }: { profile: Profile }) {
  const initial = useMemo(() => rowToValues(PROFILE_FIELDS, profile as unknown as Record<string, unknown>), [profile]);
  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatar, setAvatar] = useState(profile.avatar_url ?? "");
  const [resume, setResume] = useState(profile.resume_url ?? "");
  const [pending, startTransition] = useTransition();

  const onChange = (name: string, value: unknown) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors(({ [name]: _removed, ...rest }) => rest);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateFields(PROFILE_FIELDS, values);
    if (!check.success) {
      setErrors(check.errors);
      toast.error("Please fix the highlighted fields");
      return;
    }
    startTransition(async () => {
      const res = await saveProfile(values);
      if (res.ok) toast.success("Profile saved");
      else {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast.error("Could not save profile", { description: res.error });
      }
    });
  };

  /** Uploads are saved immediately; the old file is removed from storage. */
  const saveFile = (field: "avatar_url" | "resume_url", current: string, set: (v: string) => void, label: string) =>
    async (url: string | null) => {
      const res = await saveProfileFile(field, url);
      if (!res.ok) {
        toast.error(`Could not update ${label}`, { description: res.error });
        await removeFileByUrl(url);
        return;
      }
      await removeFileByUrl(current).catch(() => undefined);
      set(url ?? "");
      toast.success(url ? `${label} updated` : `${label} removed`);
    };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile & Bio</h1>
        <p className="mt-1 text-sm text-muted">Shown in the hero section of your homepage.</p>
      </div>

      <section className="card grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-sm font-medium">Profile picture</h2>
          <FileUpload
            bucket="avatars"
            kind="image"
            value={avatar}
            onChange={saveFile("avatar_url", avatar, setAvatar, "Profile picture")}
          />
          <p className="text-xs text-muted">Square images look best. Saved as soon as it uploads.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-sm font-medium">Resume (PDF)</h2>
          <FileUpload
            bucket="resumes"
            kind="pdf"
            value={resume}
            onChange={saveFile("resume_url", resume, setResume, "Resume")}
          />
          <p className="text-xs text-muted">Visitors get View and Download buttons.</p>
        </div>
      </section>

      <form onSubmit={submit} noValidate className="card p-5 sm:p-6">
        <FormFields fields={PROFILE_FIELDS} values={values} errors={errors} onChange={onChange} idPrefix="profile" />
        <div className="mt-6 flex justify-end">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save profile
          </button>
        </div>
      </form>
    </div>
  );
}
