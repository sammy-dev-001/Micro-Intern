import { useState } from "react";
import { Button } from "../../components/Button";
import { FormField, TextArea } from "../../components/FormField";
import type { WizardState } from "../../auth/SignupWizard";
import { useSkills } from "../../lib/skills";
import { SkillPicker } from "../../components/SkillPicker";

type Props = {
  state: WizardState;
  update: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  onFinish: () => void;
  onBack: () => void;
  submitting: boolean;
  error: string | null;
};

export function StepProfile({
  state,
  update,
  onFinish,
  onBack,
  submitting,
  error,
}: Props) {
  const isTalent = state.type === "talent";
  const { skills, loading: skillsLoading, error: skillsError } = useSkills();

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
        {isTalent ? "A bit about you" : "A bit about your business"}
      </h1>
      <p className="mt-3 text-base text-ink/70">
        All optional, you can fill this in later from your dashboard.
      </p>

      <div className="mt-8 flex flex-col gap-5">
        {isTalent ? (
          <>
            <FormField
              label="University"
              name="university"
              value={state.university}
              onChange={(e) => update("university", e.target.value)}
            />
            <FormField
              label="Course"
              name="course"
              value={state.course}
              onChange={(e) => update("course", e.target.value)}
            />
            <FormField
              label="Year of study"
              name="year_of_study"
              type="number"
              min={1}
              max={7}
              value={state.year_of_study}
              onChange={(e) => update("year_of_study", e.target.value)}
            />
            <TextArea
              label="Short bio"
              name="bio"
              placeholder="What do you do, and what are you learning?"
              value={state.bio}
              onChange={(e) => update("bio", e.target.value)}
            />
            {skillsLoading ? (
              <p className="text-sm text-ink/60">Loading skills…</p>
            ) : skillsError ? (
              <p className="text-sm text-red-600">
                Could not load skills list. You can skip this for now and add
                skills later from your dashboard.
              </p>
            ) : (
              <SkillPicker
                label="Skills"
                options={skills.map((s) => s.name)}
                value={state.skills}
                onChange={(next) => update("skills", next)}
              />
            )}
          </>
        ) : (
          <>
            <FormField
              label="Company name"
              name="company_name"
              value={state.company_name}
              onChange={(e) => update("company_name", e.target.value)}
            />
            <FormField
              label="Industry"
              name="industry"
              value={state.industry}
              onChange={(e) => update("industry", e.target.value)}
            />
            <FormField
              label="Company size"
              name="company_size"
              placeholder="e.g. 1–10, 11–50, 50+"
              value={state.company_size}
              onChange={(e) => update("company_size", e.target.value)}
            />
            <FormField
              label="Website"
              name="website"
              type="url"
              placeholder="https://"
              value={state.website}
              onChange={(e) => update("website", e.target.value)}
            />
          </>
        )}

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button variant="ghost" size="lg" onClick={onBack} type="button">
            Back
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={onFinish}
            disabled={submitting}
            type="button"
          >
            {submitting ? "Creating account…" : "Finish signing up"}
          </Button>
        </div>
      </div>
    </div>
  );
}
