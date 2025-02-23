import React from 'react'
import MultipleFileUploader from './multiple-file-uploader'

const ImagesStep = () => {
  return (
    <div className='mb-8'>
      <MultipleFileUploader multiple={true}/>
    </div>
  )
}

export default ImagesStep
