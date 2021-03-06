import React from 'react'
import { BaseUpdate, FormContainer, FormSection, JsonField, NotFound } from 'features/shared/components'
import { reduxForm } from 'redux-form'
import { docsRoot } from 'utility/environment'

class Form extends React.Component {
  constructor(props) {
    super(props)

    this.submitWithErrors = this.submitWithErrors.bind(this)

    this.state = {}
  }

  submitWithErrors(data) {
    return this.props.submitForm(data, this.props.item.id).catch(err => {
      throw {_error: err}
    })
  }

  componentDidMount() {
    this.props.fetchItem(this.props.params.id).then(resp => {
      if (resp.data.length == 0) {
        this.setState({notFound: true})
      }
    })
  }

  render() {
    if (this.state.notFound) {
      return <NotFound />
    }
    const item = this.props.item
    const lang = this.props.lang

    if (!item) {
      return <div>Loading...</div>
    }

    const {
      fields: { tags },
      error,
      handleSubmit,
      submitting
    } = this.props

    const title = <span>
      {lang === 'zh' ? '编辑资产tags' : 'Edit asset tags '}
      <code>{item.alias ? item.alias :item.id}</code>
    </span>

    const tagsString = Object.keys(item.tags || {}).length === 0 ? '{\n\t\n}' : JSON.stringify(item.tags || {}, null, 1)
    const tagLines = tagsString.split(/\r\n|\r|\n/).length
    let JsonFieldHeight

    if (tagLines < 5) {
      JsonFieldHeight = '80px'
    } else if (tagLines < 20) {
      JsonFieldHeight = `${tagLines * 17}px`
    } else {
      JsonFieldHeight = '340px'
    }

    return <FormContainer
      error={error}
      label={title}
      onSubmit={handleSubmit(this.submitWithErrors)}
      submitting={submitting}
      lang={lang}>

    <FormSection title='Asset Tags'>
        <JsonField
          height={JsonFieldHeight}
          fieldProps={tags}
          lang={lang} />

        <p>
          { lang === 'zh' ? ('注意：资产标签可用于查询交易，unspent outputs和余额。查询反映了提交交易时出现的资产标签。只有新的交易活动才会反映更新后的标签。 '
          ) :(
            'Note: Asset tags can be used for querying transactions, unspent outputs, and balances. ' +
            'Queries reflect the asset tags that are present when transactions are submitted.' +
            ' Only new transaction activity will reflect the updated tags. '
          )}
           <a href={`${docsRoot}/core/build-applications/assets#update-tags-on-existing-assets`} target='_blank' style={{whiteSpace: 'nowrap'}}>
             { lang === 'zh' ? '了解更多' : 'Learn more'} →</a>
        </p>
      </FormSection>
    </FormContainer>
  }
}

const mapStateToProps = (state, ownProps) => ({
  item: state.asset.items[ownProps.params.id],
  lang: state.core.lang
})

const initialValues = (state, ownProps) => {
  const item = state.asset.items[ownProps.params.id]
  if (item) {
    const tags = Object.keys(item.tags || {}).length === 0 ? '{\n\t\n}' : JSON.stringify(item.tags || {}, null, 1)
    return {
      initialValues: {
        tags: tags
      }
    }
  }
  return {}
}

const updateForm = reduxForm({
  form: 'updateAssetForm',
  fields: ['tags'],
  validate: values => {
    const errors = {}

    const jsonFields = ['tags']
    jsonFields.forEach(key => {
      const fieldError = JsonField.validator(values[key])
      if (fieldError) { errors[key] = fieldError }
    })

    return errors
  }
}, initialValues)(Form)

export default BaseUpdate.connect(
  mapStateToProps,
  BaseUpdate.mapDispatchToProps('asset'),
  updateForm
)
