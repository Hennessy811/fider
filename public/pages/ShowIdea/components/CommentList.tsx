import * as React from "react";
import { Idea, Comment, CurrentUser } from "@fider/models";
import { Failure, actions, formatDate } from "@fider/services";
import { DisplayError, Button, UserName, Gravatar, Moment, MultiLineText, TextArea, Form } from "@fider/components";

interface CommentListProps {
  idea: Idea;
  comments: Comment[];
  user?: CurrentUser;
  onStartEdit?: () => void;
  onStopEdit?: () => void;
}

interface CommentListState {
  editingComment?: Comment;
  editCommentNewContent: string;
  error?: Failure;
}

export class CommentList extends React.Component<CommentListProps, CommentListState> {
  constructor(props: CommentListProps) {
    super(props);
    this.state = {
      editCommentNewContent: ""
    };
  }

  private async startEdit(comment: Comment): Promise<void> {
    this.setState({
      editingComment: comment,
      editCommentNewContent: comment.content,
      error: undefined
    });

    if (this.props.onStartEdit) {
      this.props.onStartEdit();
    }
  }

  private async cancelEdit(): Promise<void> {
    this.setState({
      editingComment: undefined,
      editCommentNewContent: "",
      error: undefined
    });

    if (this.props.onStopEdit) {
      this.props.onStopEdit();
    }
  }

  private async confirmEdit(): Promise<void> {
    if (this.state.editingComment) {
      const response = await actions.updateComment(
        this.props.idea.number,
        this.state.editingComment.id,
        this.state.editCommentNewContent
      );
      if (response.ok) {
        this.state.editingComment.content = this.state.editCommentNewContent;
        this.state.editingComment.editedOn = new Date().toISOString();
        this.state.editingComment.editedBy = this.props.user;
        this.cancelEdit();
      } else {
        this.setState({ error: response.error });
      }
    }
  }

  private canEditComment(comment: Comment): boolean {
    if (this.props.user) {
      return this.props.user.isCollaborator || comment.user.id === this.props.user.id;
    }
    return false;
  }

  public render() {
    return this.props.comments.map(c => {
      return (
        <div key={c.id} className="c-comment">
          <Gravatar user={c.user} />
          <div className="c-comment-content">
            <UserName user={c.user} />
            <div className="c-comment-metadata">
              · <Moment date={c.createdOn} />
            </div>
            {!!c.editedOn &&
              !!c.editedBy && (
                <div className="c-comment-metadata">
                  ·{" "}
                  <span title={`This comment has been edited by ${c.editedBy!.name} on ${formatDate(c.editedOn)}`}>
                    edited
                  </span>
                </div>
              )}
            {this.canEditComment(c) && (
              <div className="c-comment-metadata">
                ·{" "}
                <span className="clickable" onClick={() => this.startEdit(c)}>
                  edit
                </span>
              </div>
            )}
            <div className="c-comment-text">
              {c === this.state.editingComment ? (
                <Form error={this.state.error}>
                  <TextArea
                    field="content"
                    minRows={1}
                    value={this.state.editCommentNewContent}
                    placeholder={c.content}
                    onChange={editCommentNewContent =>
                      this.setState({
                        editCommentNewContent
                      })
                    }
                  />
                  <Button size="tiny" onClick={() => this.confirmEdit()} color="positive">
                    Save
                  </Button>
                  <Button size="tiny" onClick={() => this.cancelEdit()}>
                    Cancel
                  </Button>
                </Form>
              ) : (
                <MultiLineText text={c.content} style="simple" />
              )}
            </div>
          </div>
        </div>
      );
    });
  }
}