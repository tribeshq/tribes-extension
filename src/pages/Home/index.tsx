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
import asset1 from '../../assets/img/asset1.svg';

export default function Home(): ReactElement {
  const requests = useRequests();
  const navigate = useNavigate();
  const [error, showError] = useState('');
  const dispatch = useDispatch();

  const simulateNotarizationSteps = async (firstGraphqlRequest: any) => {
    try {
      const headers = firstGraphqlRequest.requestHeaders.reduce(
        (acc, header) => {
          acc[header.name] = header.value ?? '';
          return acc;
        },
        {} as { [key: string]: string },
      );

      const maxSentData = await getMaxSent();
      const maxRecvData = await getMaxRecv();
      const notaryUrl = await getNotaryApi();
      const websocketProxyUrl = await getProxyApi();

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
        secretHeaders: [],
        secretResps: [],
        status: 'pending',
      };

      return requestHistory;
    } catch (err) {
      showError(`Failed to prepare notarization: ${err.message}`);
      throw err;
    }
  };

  const handleWeGucciClick = async () => {
    const firstGraphqlRequest = requests.find((request) =>
      request.url.includes('graphql/query'),
    );

    if (!firstGraphqlRequest) {
      showError('No request with "graphql" found');
    } else {
      try {
        const preparedRequest =
          await simulateNotarizationSteps(firstGraphqlRequest);

        dispatch(notarizeRequest(preparedRequest));

        // navigate(`/notary/${firstGraphqlRequest.requestId}`);
      } catch (err) {
        showError(`Failed to notarize request: ${err.message}`);
      }
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center h-full bg-cover bg-no-repeat bg-center"
      style={{ backgroundImage: `url(${asset1})` }}
    >
      {error && <ErrorModal onClose={() => showError('')} message={error} />}

      {/* Title Section */}
      <h1 className="text-5xl font-bold text-white mb-6">Verify</h1>

      {/* Button */}
      <button
        onClick={handleWeGucciClick}
        className="bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-gray-800 transition-all"
      >
        we gucci
      </button>
      <NavButton fa="fa-solid fa-list" onClick={() => navigate('/history')}>
        History
      </NavButton>
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
