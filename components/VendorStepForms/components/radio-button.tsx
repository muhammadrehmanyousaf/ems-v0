import React from 'react'

interface RadioCompontent {
    data: { id: string, label: string }[],
    selectedOption: string | null,
    setSelectedOption: (id: string) => void
};

const RadioButton:React.FC<RadioCompontent> = ({data, selectedOption, setSelectedOption}) => {
    return (
        <div className="flex flex-wrap items-center gap-3 mt-3">
            {data.map((option) => (
                <label
                    key={option.id}
                    className={`flex items-center cursor-pointer space-x-1.5 py-1.5 pr-5 lg:pr-8 rounded-full border ${selectedOption === option.id ? "border-roze-default shadow-lg" : ""}hover:bg-gray-100`}>
                    <input
                        type="radio"
                        name="custom-radio"
                        value={option.id}
                        checked={selectedOption === option.id}
                        onChange={() => setSelectedOption(option.id)}
                        className="hidden"
                    />
                    <div
                        className={`size-8 flex items-center justify-center rounded-full ${selectedOption === option.id ?
                        "bg-roze-default" : ""}`}>
                        <div className={`w-2 h-2 ${selectedOption === option.id ? 'bg-white' : 'bg-[#6b7983]'} rounded-full`}></div>
                    </div>
                    <span className={selectedOption === option.id ? "text-roze-default text-sm font-medium" : "text-[#6b7983] text-sm font-medium"}>{option.label}</span>
                </label>
            ))}
        </div>
    )
}

export default RadioButton
