import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Check, X } from 'lucide-react'
import React from 'react'

interface MultipleSelectComponent {
    label: string,
    data: { value: string, label: string }[],
    handleSelectOption: (id: string) => void,
    selectedOption: string[];
    placeholder: string;
};

const MultipleSelect:React.FC<MultipleSelectComponent> = ({label, data, handleSelectOption, selectedOption, placeholder}) => {

  return (
    <div className='space-y-4'>
      <Label>{label}</Label>
                <Select>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={placeholder}>
                            Select Expertise
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="w-full p-2">
                        <div className="flex flex-col space-y-2 w-full">
                            {data.map((item) => (
                                <div
                                    key={item.value}
                                    className="flex items-center space-x-2 cursor-pointer px-2 py-1 hover:bg-gray-100 rounded-md"
                                    onClick={() => handleSelectOption(item.value)}
                                >
                                    <Check className={`size-4 ${selectedOption.includes(item.value) ? 'opacity-100' : 'opacity-0'}`} />
                                    <span className="text-sm">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </SelectContent>
                </Select>
                <div className="flex flex-wrap items-center gap-2">
                    {selectedOption.length > 0 &&
                        selectedOption.map((item, i) => (
                            <span key={i} className="flex items-center gap-2 bg-[#e6e6e6] py-2 px-2">
                                <p className="text-sm">{item}</p>
                                <Button size={'icon'} onClick={() => handleSelectOption(item)} className="size-4 bg-transparent text-black hover:text-white"><X /></Button>
                            </span>
                        ))}
                </div>
    </div>
  )
}

export default MultipleSelect
