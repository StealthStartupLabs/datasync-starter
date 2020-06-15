import React from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { IonContent, IonLoading, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import { Header } from '../components/Header';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { Empty } from '../components';
import { createComment } from '../graphql/generated';
import { commentViewSchema } from '../forms/task';
import { AutoForm } from "uniforms-ionic";
import { TaskView } from '../forms/TaskForm';
import { findTasks } from '../graphql/generated';

export interface ViewMatchParams {
  id: string
}

export const ViewTaskPage: React.FC<RouteComponentProps<ViewMatchParams>> = ({ history, match }) => {
  const { id } = match.params;

  const [createCommentMutation] = useMutation(
    createComment, { refetchQueries: [{ query: findTasks }] }
  );

  const submit = (model: any) => {
    createCommentMutation({
      variables: { input: { ...model, noteId: id } }
    }).then((comment) => {
      console.log("comment created")
    }).catch((error) => {
      console.log(error)
    })
  }

  const { loading, error, data } = useQuery(findTasks, {
    variables: { fields: { id } },
    fetchPolicy: 'cache-only',
  });

  if (error) return <pre>{JSON.stringify(error)}</pre>;

  if (loading) return <IonLoading
    isOpen={loading}
    message={'Loading...'}
  />;
  if (data && data.findTasks) {
    const task = data.findTasks;
    return (
      <>
        <Header title="Task" backHref="/tasks" match={match} />
        <IonContent>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Current Task</IonCardTitle>
            </IonCardHeader>
            <TaskView model={task} />
          </IonCard>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Create comment</IonCardTitle>
            </IonCardHeader>

            <IonCardContent>
              <AutoForm schema={commentViewSchema} onSubmit={submit} model={{ author: "Starter User" }} />
            </IonCardContent>
          </IonCard>
        </IonContent>
      </>
    )
  }
  return (
    <>
      <Header title="task" backHref="/tasks" match={match} />
      <Empty message={<p>No task found</p>} />
    </>
  );
}