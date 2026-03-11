import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import React from "react";

interface MultipleRadioComponent {
  label: string;
  data: { value: string; label?: string; icon?: any }[];
  handleSelect: (type: string, index: number) => void;
  selectedIndexes: number[];
}

const MultipleRadio: React.FC<MultipleRadioComponent> = ({
  label,
  data,
  handleSelect,
  selectedIndexes,
}) => {
  // Safety check to prevent map error
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {data.map((type, index) => (
          <Button
            onClick={() => handleSelect(type.value, index)}
            key={index}
            className={`border flex items-center gap-2 pl-2 pr-5 py-2 rounded-lg bg-transparent hover:bg-slate-400/10 ${
              selectedIndexes.includes(index)
                ? "border-roze-default text-roze-default shadow-lg"
                : "text-[#000000]"
            }`}
          >
            {type.icon && (
              <span
                className={`py-2 px-2 text-lg rounded-md ${
                  selectedIndexes.includes(index)
                    ? "bg-roze-default text-gray-950"
                    : "text-[#050505]"
                }`}
              >
                {type.icon}
              </span>
            )}
            <span
              style={{ fontWeight: "500" }}
              className="font-medium text-xs uppercase"
            >
              {type.label || type.value}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default MultipleRadio;
