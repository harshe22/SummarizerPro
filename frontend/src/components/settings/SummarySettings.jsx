import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import useAppStore from '../../store/useAppStore'

const SummarySettings = () => {
  const { summarySettings, updateSummarySettings } = useAppStore()
  const [isExpanded, setIsExpanded] = useState(false)

  const summaryTypes = [
    { value: 'comprehensive', label: 'Comprehensive', description: 'Detailed overview of the content' },
    { value: 'bullet_points', label: 'Bullet Points', description: 'Key points in bullet format' },
    { value: 'story', label: 'Story Format', description: 'Narrative style summary' }
  ]

  const summaryStyles = [
    { value: 'brief', label: 'Brief', description: 'Concise and to the point' },
    { value: 'detailed', label: 'Detailed', description: 'Thorough and informative' },
    { value: 'comprehensive', label: 'Comprehensive', description: 'In-depth and complete' }
  ]

  const handleSettingChange = (key, value) => {
    updateSummarySettings({ [key]: value })
  }

  const resetToDefaults = () => {
    updateSummarySettings({
      summaryType: 'comprehensive',
      summaryStyle: 'comprehensive',
      customPrompt: ''
    })
  }

  return (
    <Card className="mb-3">
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-xs font-medium">
            <Settings className="w-3 h-3" />
            <span>Summary Settings</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <CardContent className="space-y-3 pt-2">
            {/* Summary Type */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Summary Type</Label>
              <Select
                value={summarySettings.summaryType}
                onValueChange={(value) => handleSettingChange('summaryType', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {summaryTypes.find(t => t.value === summarySettings.summaryType)?.label || 'Select type...'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {summaryTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{type.label}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Summary Style */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Summary Style</Label>
              <Select
                value={summarySettings.summaryStyle}
                onValueChange={(value) => handleSettingChange('summaryStyle', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {summaryStyles.find(s => s.value === summarySettings.summaryStyle)?.label || 'Select style...'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {summaryStyles.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{style.label}</span>
                        <span className="text-xs text-muted-foreground">{style.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Prompt */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Label className="text-xs font-medium">Custom Prompt</Label>
                <Badge variant="secondary" className="text-xs px-1 py-0">Optional</Badge>
              </div>
              <Textarea
                value={summarySettings.customPrompt}
                onChange={(e) => handleSettingChange('customPrompt', e.target.value)}
                placeholder="Enter a custom prompt to guide the summarization (e.g., 'Summarize this focusing on the main benefits and drawbacks...')"
                className="min-h-[60px] text-xs"
              />
              <div className="flex items-start space-x-2 text-xs text-muted-foreground">
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>
                  Custom prompts override the default summary type and style. Leave empty to use standard settings.
                </span>
              </div>
            </div>

            {/* Style Preview */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-xs font-medium mb-2">Current Configuration:</div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  Type: {summaryTypes.find(t => t.value === summarySettings.summaryType)?.label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Style: {summaryStyles.find(s => s.value === summarySettings.summaryStyle)?.label}
                </Badge>
                {summarySettings.customPrompt && (
                  <Badge variant="secondary" className="text-xs">
                    Custom Prompt Active
                  </Badge>
                )}
              </div>
            </div>

            {/* Reset Button */}
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefaults}
                className="text-xs"
              >
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </motion.div>
      )}
    </Card>
  )
}

export default SummarySettings
