import React, { useCallback } from 'react'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X } from 'lucide-react'
import { Button } from '../ui/button'
import useAppStore from '../../store/useAppStore'
import SummarySettings from '../settings/SummarySettings'
import { formatFileSize, getFileExtension, isValidFileType } from '../../lib/utils'
import toast from 'react-hot-toast'

const FileInput = () => {
  const { inputContent, updateInputContent, isLoading } = useAppStore()
  const allowedTypes = ['pdf', 'docx', 'txt']

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    rejectedFiles.forEach((file) => {
      toast.error(`${file.file.name} is not a supported file type`)
    })

    // Handle accepted files
    const validFiles = acceptedFiles.filter((file) => {
      if (!isValidFileType(file, allowedTypes)) {
        toast.error(`${file.name} is not a supported file type`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large (max 10MB)`)
        return false
      }
      return true
    })

    if (validFiles.length > 0) {
      const newFiles = [...inputContent.files, ...validFiles]
      updateInputContent('files', newFiles)
      toast.success(`${validFiles.length} file(s) added`)
    }
  }, [inputContent.files, updateInputContent])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: true,
    disabled: isLoading // Disable dropzone during processing
  })

  const removeFile = (index) => {
    const newFiles = inputContent.files.filter((_, i) => i !== index)
    updateInputContent('files', newFiles)
  }

  const getFileIcon = (filename) => {
    const ext = getFileExtension(filename)
    return <File className="w-4 h-4" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <SummarySettings />
      
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isLoading
            ? 'border-muted-foreground/10 bg-muted/20 cursor-not-allowed opacity-50'
            : isDragActive
            ? 'border-primary bg-primary/5 cursor-pointer'
            : 'border-muted-foreground/25 hover:border-primary/50 cursor-pointer'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-sm text-primary">Drop the files here...</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Drag & drop files here, or click to select
            </p>
            <p className="text-xs text-muted-foreground">
              Supports PDF, DOCX, TXT files (max 10MB each)
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {inputContent.files.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Selected Files ({inputContent.files.length})</label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {inputContent.files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {getFileIcon(file.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default FileInput
