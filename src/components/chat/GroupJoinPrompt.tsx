import { useJoinGroup, useRejectGroup } from '#/integrations/useChat'
import { Users } from 'lucide-react'
import { Button, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

interface Props {
  groupId: number
  groupName: string
}

export default function GroupJoinPrompt({ groupId, groupName }: Props) {
  const { t } = useTranslation()
  const join = useJoinGroup()
  const reject = useRejectGroup()

  return (
    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center p-4">
      <div className="bg-primary bg-opacity-10 rounded-circle p-4 mb-3">
        <Users size={40} className="text-primary" />
      </div>
      <h5 className="fw-bold">{groupName}</h5>
      <p className="text-secondary mb-4">
        {t('chat_join_invite_desc')}
      </p>
      <div className="d-flex gap-2">
        <Button
          variant="primary"
          className="px-4"
          disabled={join.isPending || reject.isPending}
          onClick={() => join.mutate(groupId)}
        >
          {join.isPending ? <Spinner animation="border" size="sm" /> : t('chat_join_group')}
        </Button>
        <Button
          variant="outline-secondary"
          className="px-4"
          disabled={join.isPending || reject.isPending}
          onClick={() => reject.mutate(groupId)}
        >
          {reject.isPending ? <Spinner animation="border" size="sm" /> : t('chat_decline')}
        </Button>
      </div>
    </div>
  )
}
