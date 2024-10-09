import React, {
  MouseEventHandler,
  ReactElement,
  ReactNode,
  useState,
} from 'react';
import Icon from '../../components/Icon';
import classNames from 'classnames';
import { useNavigate } from 'react-router';
import { notarizeRequest, useRequests } from '../../reducers/requests';
import { ErrorModal } from '../../components/ErrorModal';
import { useDispatch } from 'react-redux';
import {
  getMaxRecv,
  getMaxSent,
  getNotaryApi,
  getProxyApi,
} from '../../utils/storage';

export default function Home(): ReactElement {
  const requests = useRequests();
  const navigate = useNavigate();
  const [error, showError] = useState('');
  const dispatch = useDispatch();

  // Função que simula todas as etapas antes de enviar a request
  const simulateNotarizationSteps = async (firstGraphqlRequest: any) => {
    try {
      const headers = firstGraphqlRequest.requestHeaders.reduce(
        (acc, header) => {
          acc[header.name] = header.value ?? ''; // Garante que não seja undefined
          return acc;
        },
        {} as { [key: string]: string },
      );

      // Coletar os dados necessários da storage
      const maxSentData = await getMaxSent();
      const maxRecvData = await getMaxRecv();
      const notaryUrl = await getNotaryApi();
      const websocketProxyUrl = await getProxyApi();

      // Criação do objeto RequestHistory
      const requestHistory = {
        id: firstGraphqlRequest.requestId,
        url: firstGraphqlRequest.url,
        method: firstGraphqlRequest.method,
        headers,
        body: firstGraphqlRequest.requestBody ?? '',
        maxSentData,
        maxRecvData,
        notaryUrl,
        websocketProxyUrl,
        secretHeaders: [], // Ajustar conforme necessário
        secretResps: [], // Ajustar conforme necessário
        status: 'pending', // Simula o status inicial
      };

      // Retorna o objeto após simular todas as etapas
      return requestHistory;
    } catch (err) {
      showError(`Failed to prepare notarization: ${err.message}`);
      throw err;
    }
  };

  // Função para lidar com o clique no botão "we gucci"
  const handleWeGucciClick = async () => {
    // Encontra a primeira request que contenha 'graphql' na URL
    const firstGraphqlRequest = requests.find((request) =>
      request.url.includes('graphql/query'),
    );

    if (!firstGraphqlRequest) {
      // Se não encontrar uma requisição com 'graphql', exibe um erro
      showError('No request with "graphql" found');
    } else {
      try {
        // Simula todas as etapas antes de enviar a request
        const preparedRequest =
          await simulateNotarizationSteps(firstGraphqlRequest);

        // Dispara a ação de notarização somente após todas as etapas serem simuladas
        dispatch(notarizeRequest(preparedRequest));

        // Navega para a tela de notarização
        navigate(`/notary/${firstGraphqlRequest.requestId}`);
      } catch (err) {
        showError(`Failed to notarize request: ${err.message}`);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 py-4 overflow-y-auto bg-fourfh h-full">
      {error && <ErrorModal onClose={() => showError('')} message={error} />}
      <div className="flex flex-col flex-nowrap justify-center gap-2 mx-4">
        <NavButton fa="fa-solid fa-table" onClick={() => navigate('/requests')}>
          <span>Requests</span>
          <span>{`(${requests.length})`}</span>
        </NavButton>
        <NavButton fa="fa-solid fa-list" onClick={() => navigate('/history')}>
          History
        </NavButton>
        <NavButton fa="fa-solid fa-gear" onClick={() => navigate('/options')}>
          Options
        </NavButton>
      </div>

      <button onClick={handleWeGucciClick}>we gucci</button>
    </div>
  );
}

function NavButton(props: {
  fa: string;
  children?: ReactNode;
  onClick?: MouseEventHandler;
  className?: string;
  disabled?: boolean;
}): ReactElement {
  return (
    <button
      className={classNames(
        'flex flex-row flex-nowrap items-center justify-center',
        'text-white rounded px-2 py-1 gap-1',
        {
          'bg-primary/[.8] hover:bg-primary/[.7] active:bg-primary':
            !props.disabled,
          'bg-primary/[.5]': props.disabled,
        },
        props.className,
      )}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      <Icon className="flex-grow-0 flex-shrink-0" fa={props.fa} size={1} />
      <span className="flex-grow flex-shrink w-0 flex-grow font-bold">
        {props.children}
      </span>
    </button>
  );
}
